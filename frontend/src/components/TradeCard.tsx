import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FieldMessage } from "@/components/ui/field-message";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTradeSchema, type CreateTradeDTO } from "@/dto/create-trade.dto";
import { updateTradeSchema } from "@/dto/update-trade.dto";
import type { Trade, TradeSide } from "@/types/trade.type";
import { tradesApi } from "@/lib/api/trades.api";

const SYMBOLS = [
  "AAPL",
  "MSFT",
  "GOOGL",
  "AMZN",
  "TSLA",
  "NVDA",
  "META",
  "NFLX",
  "JPM",
  "V",
];

const BOOKS = ["EQUITY-01", "EQUITY-02", "DERIVATIVES-01"];

const SIDES: TradeSide[] = ["BUY", "SELL"];

const createDefaultValues: CreateTradeDTO = {
  symbol: "",
  quantity: 0,
  price: 0,
  side: "BUY",
  book: "",
  counterparty: "",
};

function tradeToDefaultValues(trade: Trade): CreateTradeDTO {
  return {
    symbol: trade.symbol,
    quantity: trade.quantity,
    price: trade.price,
    side: trade.side,
    book: trade.book,
    counterparty: trade.counterparty,
  };
}

// Edit mode only submits the update-trade fields, but the form always holds
// the full CreateTradeDTO shape (symbol/side are shown, locked, unsubmitted),
// so the edit resolver validates the same 4 fields while passing symbol/side through.
const editTradeSchema = updateTradeSchema.extend({
  symbol: z.string(),
  side: z.enum(["BUY", "SELL"]),
});

type TradeCardProps =
  | { mode?: "create"; trade?: undefined; onSuccess?: () => void }
  | { mode: "edit"; trade: Trade; onSuccess?: () => void };

export default function TradeCard(props: TradeCardProps) {
  const { onSuccess } = props;
  const isEdit = props.mode === "edit";
  const queryClient = useQueryClient();
  const defaultValues =
    props.mode === "edit"
      ? tradeToDefaultValues(props.trade)
      : createDefaultValues;
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTradeDTO>({
    resolver: zodResolver(isEdit ? editTradeSchema : createTradeSchema),
    defaultValues,
  });

  async function onSubmit(data: CreateTradeDTO) {
    try {
      if (props.mode === "edit") {
        const { quantity, price, book, counterparty } = data;
        const res = await tradesApi.updateTrade(props.trade.id, {
          quantity,
          price,
          book,
          counterparty,
        });
        toast.success(res.message);
      } else {
        const res = await tradesApi.createTrade(data);
        reset(createDefaultValues);
        toast.success(res.message);
      }
      await queryClient.invalidateQueries({ queryKey: ["trades"] });
      onSuccess?.();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : `Failed to ${isEdit ? "update" : "create"} trade`,
      );
    }
  }

  return (
    <div>
      <form className="flex flex-col gap-3" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="symbol">Symbol</Label>
            <Controller
              control={control}
              name="symbol"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isEdit}
                >
                  <SelectTrigger id="symbol">
                    <SelectValue placeholder="Select symbol" />
                  </SelectTrigger>
                  <SelectContent>
                    {SYMBOLS.map((symbol) => (
                      <SelectItem key={symbol} value={symbol}>
                        {symbol}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldMessage error={errors.symbol?.message} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="side">Side</Label>
            <Controller
              control={control}
              name="side"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => field.onChange(value as TradeSide)}
                  disabled={isEdit}
                >
                  <SelectTrigger id="side">
                    <SelectValue placeholder="Select side" />
                  </SelectTrigger>
                  <SelectContent>
                    {SIDES.map((side) => (
                      <SelectItem key={side} value={side}>
                        {side}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldMessage error={errors.side?.message} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min={0}
              {...register("quantity", { valueAsNumber: true })}
            />
            <FieldMessage error={errors.quantity?.message} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              min={0}
              step="0.01"
              {...register("price", { valueAsNumber: true })}
            />
            <FieldMessage error={errors.price?.message} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="book">Book</Label>
            <Controller
              control={control}
              name="book"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="book">
                    <SelectValue placeholder="Select book" />
                  </SelectTrigger>
                  <SelectContent>
                    {BOOKS.map((book) => (
                      <SelectItem key={book} value={book}>
                        {book}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldMessage error={errors.book?.message} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="counterparty">Counterparty</Label>
            <Input id="counterparty" {...register("counterparty")} />
            <FieldMessage error={errors.counterparty?.message} />
          </div>
        </div>

        <Button type="submit" className="mt-1.5" disabled={isSubmitting}>
          {isEdit
            ? isSubmitting
              ? "Saving…"
              : "Save Changes"
            : isSubmitting
              ? "Creating…"
              : "Create Trade"}
        </Button>
      </form>
    </div>
  );
}
