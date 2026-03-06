import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { generateBarcodeValue } from "@/lib/barcode";
import type { Tables, Enums } from "@/types/supabase";

export type ItemType = Tables<"item_types">;
export type Item = Tables<"items">;
export type ScanLog = Tables<"scan_logs">;
export type DepartmentType = Enums<"department_type">;
export type SemesterType = Enums<"semester_type">;
export type ActionType = Enums<"action_type">;
export type ItemStatus = Enums<"item_status">;

export function useItemTypes() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["item_types", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("item_types")
        .select("*, items(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useItems() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["items", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: itemTypes, error: itErr } = await supabase
        .from("item_types")
        .select("id")
        .eq("user_id", user.id);
      if (itErr) throw itErr;

      const itemTypeIds = itemTypes?.map(it => it.id) || [];
      if (itemTypeIds.length === 0) return [];

      const { data, error } = await supabase
        .from("items")
        .select("*, item_types(item_name, department)")
        .in("item_type_id", itemTypeIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useScanLogs() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["scan_logs", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("scan_logs")
        .select("*, items(barcode, item_types(item_name, department))")
        .eq("user_id", user.id)
        .order("scan_time", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });
}

export function useAddItemType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ item_name, department, quantity, price, purchase_location, purchase_date, user_id }: {
      item_name: string; department: DepartmentType; quantity: number; price: number; purchase_location: string; purchase_date: string; user_id: string;
    }) => {
      const { data: itemType, error: itErr } = await supabase
        .from("item_types")
        .insert({ item_name, department, price, purchase_location, purchase_date, total_quantity: quantity, user_id })
        .select()
        .single();
      if (itErr) throw itErr;

      const items = Array.from({ length: quantity }, () => ({
        item_type_id: itemType.id,
        barcode: generateBarcodeValue(item_name, department),
      }));

      const { error: itemsErr } = await supabase.from("items").insert(items);
      if (itemsErr) throw itemsErr;

      const { data: createdItems } = await supabase.from("items").select("*").eq("item_type_id", itemType.id);
      return { itemType, items: createdItems || [] };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["item_types"] });
      qc.invalidateQueries({ queryKey: ["items"] });
    },
  });
}

export function useDeleteItemTypes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        const { error } = await supabase.from("item_types").delete().eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["item_types"] });
      qc.invalidateQueries({ queryKey: ["items"] });
    },
  });
}

export function useAddBarcodes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemTypeId, count = 1, barcodes }: { itemTypeId: string; count?: number; barcodes?: string[] }) => {
      const { data: it, error: itErr } = await supabase
        .from("item_types")
        .select("item_name,department,total_quantity")
        .eq("id", itemTypeId)
        .single();
      if (itErr) throw itErr;

      const items = (barcodes || Array.from({ length: count }, () =>
        generateBarcodeValue((it as any).item_name, (it as any).department)
      )).map((barcode) => ({
        item_type_id: itemTypeId,
        barcode,
      }));

      const { data: inserted, error: insertErr } = await supabase.from("items").insert(items).select();
      if (insertErr) throw insertErr;

      const { error: updErr } = await supabase
        .from("item_types")
        .update({ total_quantity: (it as any).total_quantity + items.length })
        .eq("id", itemTypeId);
      if (updErr) throw updErr;

      return inserted || [];
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["item_types"] });
      qc.invalidateQueries({ queryKey: ["items"] });
    },
  });
}

export function useScanItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ barcode, action_type, semester, user_id, issued_to }: {
      barcode: string; action_type: ActionType; semester: SemesterType; user_id: string; issued_to?: string;
    }) => {
      const { data: item, error: findErr } = await supabase
        .from("items")
        .select("*, item_types(item_name, department)")
        .eq("barcode", barcode)
        .single();
      if (findErr) throw new Error("Item not found with this barcode");

      const statusMap: Record<string, ItemStatus> = { damaged: "damaged", lost: "lost", issued: "issued", return: "available" };
      const updates: { status: ItemStatus; issued_to?: string | null } = { status: statusMap[action_type] };
      if (action_type === "issued") updates.issued_to = issued_to || null;
      if (action_type === "return") updates.issued_to = null;

      const { error: upErr } = await supabase.from("items").update(updates).eq("id", item.id);
      if (upErr) throw upErr;

      const { error: logErr } = await supabase.from("scan_logs").insert({ item_id: item.id, action_type, semester, user_id });
      if (logErr) throw logErr;

      return { item, action_type };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["item_types"] });
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["scan_logs"] });
    },
  });
}

export function useBulkScan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ barcodes, action_type, semester, user_id, issued_to }: {
      barcodes: string[]; action_type: ActionType; semester: SemesterType; user_id: string; issued_to?: string;
    }) => {
      const results: { barcode: string; success: boolean; name?: string; error?: string }[] = [];
      for (const barcode of barcodes) {
        try {
          const { data: item, error: findErr } = await supabase.from("items").select("*, item_types(item_name)").eq("barcode", barcode.trim()).single();
          if (findErr) { results.push({ barcode, success: false, error: "Not found" }); continue; }

          const statusMap: Record<string, ItemStatus> = { damaged: "damaged", lost: "lost", issued: "issued", return: "available" };
          const updates: { status: ItemStatus; issued_to?: string | null } = { status: statusMap[action_type] };
          if (action_type === "issued") updates.issued_to = issued_to || null;
          if (action_type === "return") updates.issued_to = null;

          await supabase.from("items").update(updates).eq("id", item.id);
          await supabase.from("scan_logs").insert({ item_id: item.id, action_type, semester, user_id });
          results.push({ barcode, success: true, name: item.item_types?.item_name });
        } catch {
          results.push({ barcode, success: false, error: "Failed" });
        }
      }
      return results;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["item_types"] });
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["scan_logs"] });
    },
  });
}
