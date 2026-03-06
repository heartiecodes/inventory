import { useRef, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Package, Search, ArrowUpDown, Trash2, Plus, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useItemTypes, type DepartmentType, useAddBarcodes } from "@/hooks/useInventory";
import { useDeleteItemTypes } from "@/hooks/useInventory";
import { renderBarcodeToCanvas, downloadBarcodeAsPNG, downloadCanvasesAsSinglePagePDF } from "@/lib/barcode";
import { Constants } from "@/types/supabase";
import { toast } from "sonner";

const DEPARTMENTS = Constants.public.Enums.department_type;

function BarcodeCell({ barcode }: { barcode: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (canvasRef.current) {
      renderBarcodeToCanvas(canvasRef.current, barcode, { width: 1, height: 28, displayValue: false });
    }
  }, [barcode]);

  return (
    <div className="flex items-center gap-2">
      <canvas ref={canvasRef} className="cursor-pointer h-7" onClick={() => canvasRef.current && downloadBarcodeAsPNG(canvasRef.current, barcode)} />
      <span className="text-[10px] font-mono text-muted-foreground">{barcode}</span>
    </div>
  );
}

export default function Inventory() {
  const { data: itemTypes, isLoading } = useItemTypes();
  const qc = useQueryClient();
  const deleteItemTypes = useDeleteItemTypes();
  const addBarcodes = useAddBarcodes();
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedBarcodes, setExpandedBarcodes] = useState<Set<string>>(new Set());
  const [addBarcodeDialogOpen, setAddBarcodeDialogOpen] = useState(false);
  const [selectedItemTypeId, setSelectedItemTypeId] = useState<string | null>(null);
  const [barcodeQuantity, setBarcodeQuantity] = useState("1");

  const toggleBarcodeExpand = (itemId: string) => {
    const next = new Set(expandedBarcodes);
    if (next.has(itemId)) next.delete(itemId);
    else next.add(itemId);
    setExpandedBarcodes(next);
  };

  const openAddBarcodeDialog = (itemTypeId: string) => {
    setSelectedItemTypeId(itemTypeId);
    setBarcodeQuantity("1");
    setAddBarcodeDialogOpen(true);
  };

  const handleAddBarcodes = async () => {
    if (!selectedItemTypeId) return;
    const qty = parseInt(barcodeQuantity, 10);
    if (isNaN(qty) || qty < 1) {
      toast.error("Please enter a valid quantity");
      return;
    }
    try {
      await addBarcodes.mutateAsync({ itemTypeId: selectedItemTypeId, count: qty });
      toast.success(`Added ${qty} barcode(s)`);
      setAddBarcodeDialogOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to add barcodes");
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    setBarcodeQuantity(val);
  };

  const enriched = itemTypes?.map((it) => {
    const items = (it as any).items || [];
    return {
      ...it,
      itemsList: items,
      available: items.filter((i: any) => i.status === "available").length,
      damaged: items.filter((i: any) => i.status === "damaged").length,
      lost: items.filter((i: any) => i.status === "lost").length,
      issued: items.filter((i: any) => i.status === "issued").length,
    };
  }) || [];

  const filtered = enriched
    .filter((i) => {
      const matchSearch =
        i.item_name.toLowerCase().includes(search.toLowerCase()) ||
        i.department.toLowerCase().includes(search.toLowerCase());
      const matchDept = deptFilter === "all" || i.department === deptFilter;
      return matchSearch && matchDept;
    })
    .sort((a, b) =>
      sortOrder === "asc"
        ? a.item_name.localeCompare(b.item_name)
        : b.item_name.localeCompare(a.item_name)
    );

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((i) => i.id)));
    }
  };

  const handleDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} item type(s)? This will also delete all individual items.`)) return;
    try {
      await deleteItemTypes.mutateAsync(Array.from(selectedIds));
      toast.success(`Deleted ${selectedIds.size} item type(s)`);
      setSelectedIds(new Set());
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  };

  const handleExportSelectedAsPDF = () => {
    if (selectedIds.size === 0) return;

    const selectedItems = enriched.filter((item) => selectedIds.has(item.id));
    const itemsForPdf: { canvas: HTMLCanvasElement; label: string }[] = [];

    selectedItems.forEach((item) => {
      item.itemsList.forEach((barcodeItem: any) => {
        const canvas = document.createElement("canvas");
        renderBarcodeToCanvas(canvas, barcodeItem.barcode, { width: 2, height: 60, displayValue: true });
        itemsForPdf.push({
          canvas,
          label: `${item.item_name} – ${barcodeItem.barcode}`,
        });
      });
    });

    if (itemsForPdf.length === 0) {
      toast.error("No barcodes available for selected items");
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    downloadCanvasesAsSinglePagePDF(itemsForPdf, `inventory-barcodes-${today}.pdf`);
    toast.success("PDF exported successfully");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Inventory</h2>
          <p className="text-muted-foreground text-sm mt-1">{enriched.length} item types registered</p>
        </div>
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportSelectedAsPDF}>
              <Download className="h-4 w-4 mr-2" />
              Export All as PDF
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleteItemTypes.isPending}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete ({selectedIds.size})
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {DEPARTMENTS.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")} title={`Sort ${sortOrder === "asc" ? "Z→A" : "A→Z"}`}>
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="glass rounded-2xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="p-3 w-10">
                  <Checkbox checked={selectedIds.size === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} />
                </th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Item</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Category</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Barcodes</th>
                <th className="text-center p-3 font-semibold text-muted-foreground">Qty</th>
                <th className="text-center p-3 font-semibold text-muted-foreground">Available</th>
                <th className="text-center p-3 font-semibold text-muted-foreground">Damaged</th>
                <th className="text-center p-3 font-semibold text-muted-foreground">Lost</th>
                <th className="text-center p-3 font-semibold text-muted-foreground">Issued</th>
                <th className="text-right p-3 font-semibold text-muted-foreground">Price</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="p-3">
                    <Checkbox checked={selectedIds.has(item.id)} onCheckedChange={() => toggleSelect(item.id)} />
                  </td>
                  <td className="p-3 font-medium">{item.item_name}</td>
                  <td className="p-3">
                    <Badge variant="secondary" className="text-xs">{item.department}</Badge>
                  </td>
                  <td className="p-3">
                    <div className="space-y-2">
                      {item.itemsList.length > 0 ? (
                        <>
                          <BarcodeCell barcode={item.itemsList[0].barcode} />
                          {expandedBarcodes.has(item.id) && item.itemsList.slice(1).map((bc: any) => (
                            <BarcodeCell key={bc.id} barcode={bc.barcode} />
                          ))}
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                      {item.itemsList.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleBarcodeExpand(item.id)}
                          className="text-[10px] h-auto p-1 px-2"
                        >
                          {expandedBarcodes.has(item.id) ? "See less" : `See more (+${item.itemsList.length - 1})`}
                        </Button>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openAddBarcodeDialog(item.id)}
                      title="Add barcode(s)"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </td>
                  <td className="p-3 text-center font-mono font-bold">
                    {Math.max(item.total_quantity, item.available)}
                  </td>
                  <td className="p-3 text-center font-mono text-primary">{item.available}</td>
                  <td className="p-3 text-center font-mono text-warning">{item.damaged}</td>
                  <td className="p-3 text-center font-mono text-destructive">{item.lost}</td>
                  <td className="p-3 text-center font-mono">{item.issued}</td>
                  <td className="p-3 text-right font-mono">₱{item.price.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="glass rounded-2xl p-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No items found.</p>
        </div>
      )}

      <Dialog open={addBarcodeDialogOpen} onOpenChange={setAddBarcodeDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Barcodes</DialogTitle>
            <DialogDescription>
              Enter the number of barcodes you want to generate for this item.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={barcodeQuantity}
                onChange={handleQuantityChange}
                placeholder="Enter number"
                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddBarcodeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddBarcodes} disabled={addBarcodes.isPending}>
              {addBarcodes.isPending ? "Adding..." : "Add Barcodes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
