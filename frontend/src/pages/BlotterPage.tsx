import TradeCard from "@/components/TradeCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useTradeSocket } from "@/hooks/useTradesSocket";
import { tradesApi } from "@/lib/api/trades.api";
import type { Trade } from "@/types/trade.type";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
  type ICellRendererParams,
} from "ag-grid-community";

import { AgGridReact } from "ag-grid-react";
import { Ban, Pencil, Plus, RefreshCw } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
ModuleRegistry.registerModules([AllCommunityModule]);

const TRADES_KEY = ["trades"];
function getRowId(params: { data: Trade }) {
  return params.data.id;
}

function TradeActionsCell({
  currentUserId,
  trade,
  onEdit,
}: {
  currentUserId: string | undefined;
  trade: Trade;
  onEdit: (trade: Trade) => void;
}) {
  const [isCancelOpen, setCancelOpen] = useState(false);
  const isCancelled = trade.status == "CANCELLED";
  return (
    <div className="flex flex-row flex-wrap">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => onEdit(trade)}
        disabled={trade.traderId !== currentUserId || isCancelled}
      >
        <Pencil className="size-3.5" />
      </Button>

      <AlertDialog open={isCancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogTrigger asChild disabled={isCancelled}>
          <Button variant="ghost" size="icon-sm">
            <Ban className="text-red-500 size-3.5" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this trade?</AlertDialogTitle>
            <AlertDialogDescription>
              The trade will be marked as cancelled and can no longer be
              amended.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                // Keep the dialog open until the request settles.
                try {
                  const res = await tradesApi.cancelTrade(trade.id);
                  toast.success(res.message);
                  setCancelOpen(false);
                } catch (err) {
                  console.log(err);
                  toast.error(
                    err instanceof Error
                      ? err.message
                      : "Failed to cancel trade",
                  );
                }
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function buildColumnDefs(
  currentUserId: string | undefined,
  onEdit: (trade: Trade) => void,
): ColDef<Trade>[] {
  return [
    { field: "tradeSeq", headerName: "Seq", width: 100 },
    { field: "symbol", headerName: "Symbol" },
    {
      field: "side",
      headerName: "Side",
      cellRenderer: (params: { value: Trade["side"] }) => (
        <Badge variant={params.value === "BUY" ? "default" : "destructive"}>
          {params.value}
        </Badge>
      ),
    },
    { field: "quantity", headerName: "Qty", type: "numericColumn" },
    { field: "price", headerName: "Price", type: "numericColumn" },
    {
      field: "status",
      headerName: "Status",
      cellRenderer: (params: { value: Trade["status"] }) => (
        <Badge variant={params.value === "ACTIVE" ? "secondary" : "outline"}>
          {params.value}
        </Badge>
      ),
    },
    { field: "book", headerName: "Book" },
    { field: "counterparty", headerName: "Counterparty" },
    {
      field: "tradeTimestamp",
      headerName: "Time",
      valueFormatter: (params) => new Date(params.value).toLocaleString(),
      sort: "desc",
    },
    {
      colId: "actions",
      headerName: "Actions",
      pinned: "right",
      width: 30,
      sortable: false,
      filter: false,
      resizable: false,
      cellRenderer: (params: ICellRendererParams<Trade>) => {
        if (!params.data) {
          return null;
        }
        return (
          <TradeActionsCell
            currentUserId={currentUserId}
            trade={params.data}
            onEdit={onEdit}
          />
        );
      },
    },
  ];
}

const defaultColDef: ColDef = {
  sortable: true,
  filter: true,
  resizable: true,
  flex: 1,
  minWidth: 110,
};

export function BlotterPage() {
  const { token, user, logout } = useAuth();
  const queryClient = useQueryClient();
  const gridRef = useRef<AgGridReact<Trade>>(null);

  const [isTradeCardOpen, setTradeCardOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);

  const columnDefs = buildColumnDefs(user?.id, setEditingTrade);

  const tradesQuery = useQuery({
    queryKey: TRADES_KEY,
    queryFn: () => tradesApi.list(),
    enabled: !!token,
  });

  useTradeSocket(
    token,
    (update) => {
      const api = gridRef.current?.api;
      // Grid isn't mounted yet (e.g. the list was empty) — fall back to
      // updating the query cache so the empty-state check re-renders it.
      if (!api) {
        queryClient.setQueryData<Trade[]>(TRADES_KEY, (prev = []) => {
          if (prev.some((t) => t.id === update.trade.id)) return prev;
          return [update.trade, ...prev];
        });
        return;
      }
      if (update.type === "trade.created") {
        if (api.getRowNode(update.trade.id)) return;
        api.applyTransaction({ add: [update.trade], addIndex: 0 });
      } else {
        api.applyTransaction({ update: [update.trade] });
      }
    },
    (message) => {
      if (message.toLowerCase().includes("unauthorized")) {
        logout();
      }
    },
  );

  if (tradesQuery.isPending) {
    return <p className="text-sm text-muted-foreground">Loading Trades...</p>;
  }

  if (tradesQuery.isError) {
    return (
      <p className="text-sm text-destructive">
        Failed to load trades. Please try refreshing the page.
      </p>
    );
  }

  if (tradesQuery.data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No trades yet. New trades will appear here in real time.
      </p>
    );
  }

  return (
    <div className="ag-theme-quartz h-[calc(100svh-8rem)] w-full flex flex-col gap-2">
      <div className="flex items-center gap-2 self-end">
        <Button
          variant="outline"
          onClick={() =>
            toast.promise(tradesQuery.refetch(), {
              loading: "Refreshing trades…",
              success: "Trades refreshed",
              error: "Failed to refresh trades",
            })
          }
          disabled={tradesQuery.isFetching}
        >
          <RefreshCw
            className={tradesQuery.isFetching ? "animate-spin" : undefined}
          />
          Refresh
        </Button>
        <Dialog open={isTradeCardOpen} onOpenChange={setTradeCardOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus></Plus> Create Trade
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-lg">Create Trade</DialogTitle>
            </DialogHeader>
            <TradeCard onSuccess={() => setTradeCardOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
      <Dialog
        open={!!editingTrade}
        onOpenChange={(open) => !open && setEditingTrade(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-lg">Edit Trade</DialogTitle>
          </DialogHeader>
          {editingTrade && (
            <TradeCard
              mode="edit"
              trade={editingTrade}
              onSuccess={() => setEditingTrade(null)}
            />
          )}
        </DialogContent>
      </Dialog>
      <AgGridReact<Trade>
        ref={gridRef}
        rowData={tradesQuery.data}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        getRowId={getRowId}
        animateRows
        rowBuffer={15}
        suppressRowVirtualisation={false}
        suppressColumnVirtualisation={false}
      />
    </div>
  );
}
