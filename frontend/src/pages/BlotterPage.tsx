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
import {
  AlertTriangle,
  Ban,
  Inbox,
  Pencil,
  Plus,
  RefreshCw,
} from "lucide-react";
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
    <div className="flex flex-row flex-wrap justify-center">
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
    {
      field: "tradeSeq",
      headerName: "Seq",
      width: 100,
      cellClass: "font-mono tabular-nums text-muted-foreground",
    },
    { field: "symbol", headerName: "Symbol", cellClass: "font-medium" },
    {
      field: "side",
      headerName: "Side",
      cellRenderer: (params: { value: Trade["side"] }) => (
        <Badge variant={params.value === "BUY" ? "default" : "destructive"}>
          {params.value}
        </Badge>
      ),
    },
    {
      field: "quantity",
      headerName: "Qty",
      type: "numericColumn",
      cellClass: "font-mono tabular-nums",
    },
    {
      field: "price",
      headerName: "Price",
      type: "numericColumn",
      cellClass: "font-mono tabular-nums",
    },
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
      cellClass: "font-mono tabular-nums text-muted-foreground",
      sort: "desc",
    },
    {
      colId: "actions",
      headerName: "Actions",
      pinned: "right",
      width: 90,
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
  const [rowCount, setRowCount] = useState<number | null>(null);

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

  const count = rowCount ?? tradesQuery.data?.length ?? 0;

  return (
    <div className="flex h-[calc(100svh-8rem)] w-full flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-xl font-semibold">Blotter</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {tradesQuery.data
              ? `${count} trade${count === 1 ? "" : "s"}`
              : "Trades booked on the desk"}
          </p>
        </div>

        <div className="flex items-center gap-2">
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
                <Plus /> Create Trade
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

      {tradesQuery.isPending ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-sm text-muted-foreground">
          <RefreshCw className="size-5 animate-spin" />
          Loading trades…
        </div>
      ) : tradesQuery.isError ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-destructive/30 text-center text-sm text-destructive">
          <AlertTriangle className="size-5" />
          Failed to load trades. Please try refreshing the page.
        </div>
      ) : tradesQuery.data.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border text-center">
          <Inbox className="size-6 text-muted-foreground" />
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">No trades yet</p>
          </div>
          <Button size="sm" onClick={() => setTradeCardOpen(true)}>
            <Plus /> Create Trade
          </Button>
        </div>
      ) : (
        <AgGridReact<Trade>
          ref={gridRef}
          className="ag-theme-quartz flex-1"
          rowData={tradesQuery.data}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          getRowId={getRowId}
          animateRows
          rowBuffer={15}
          suppressRowVirtualisation={false}
          suppressColumnVirtualisation={false}
          onRowDataUpdated={(params) =>
            setRowCount(params.api.getDisplayedRowCount())
          }
        />
      )}
    </div>
  );
}
