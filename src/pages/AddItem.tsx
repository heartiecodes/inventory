import { useState, useRef, useEffect } from "react";
import { PlusCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAddItemType, type DepartmentType, useAddBarcodes, useItemTypes } from "@/hooks/useInventory";
import { useAuth } from "@/hooks/useAuth";
import { renderBarcodeToCanvas, downloadBarcodeAsPNG, downloadCanvasesAsSinglePagePDF } from "@/lib/barcode";
import { toast } from "sonner";
import { Constants } from "@/types/supabase";

const DEPARTMENTS = Constants.public.Enums.department_type;

export default function AddItem() {
  const [itemName, setItemName] = useState("");
  const [department, setDepartment] = useState<DepartmentType | "">("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [purchaseLocation, setPurchaseLocation] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0]);
  const [generatedItems, setGeneratedItems] = useState<{ barcode: string }[]>([]);
  const [lastItemName, setLastItemName] = useState("");
  const canvasRefs = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const addItemType = useAddItemType();
  const addBarcodes = useAddBarcodes();
  const { data: itemTypes } = useItemTypes();
  const { user } = useAuth();

  useEffect(() => {
    generatedItems.forEach((item) => {
      const canvas = canvasRefs.current.get(item.barcode);
      if (canvas) renderBarcodeToCanvas(canvas, item.barcode);
    });
  }, [generatedItems]);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    setQuantity(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(quantity);
    if (!itemName.trim() || !department || !user || !qty || qty < 1) return;
    try {
      const existing = itemTypes?.find(
        (t) => t.item_name === itemName.trim() && t.department === department
      );

      if (existing) {
        const newItems = await addBarcodes.mutateAsync({ itemTypeId: existing.id, count: qty });
        setGeneratedItems(newItems || []);
        setLastItemName(itemName.trim());
        toast.success(`Added ${qty} unit(s) to existing "${itemName}"`);
      } else {
        const result = await addItemType.mutateAsync({
          item_name: itemName.trim(),
          department: department as DepartmentType,
          quantity: qty,
          price: parseFloat(price) || 0,
          purchase_location: purchaseLocation,
          purchase_date: purchaseDate,
          user_id: user.id,
        });
        setGeneratedItems(result.items);
        setLastItemName(itemName.trim());
        toast.success(`"${itemName}" added with ${result.items.length} barcodes generated!`);
      }

      setItemName("");
      setQuantity("");
      setPrice("");
      setPurchaseLocation("");
    } catch (err: any) {
      toast.error(err.message || "Failed to add item");
    }
  };

  const downloadAllAsPNG = () => {
    generatedItems.forEach((item) => {
      const canvas = canvasRefs.current.get(item.barcode);
      if (canvas) downloadBarcodeAsPNG(canvas, item.barcode);
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Add New Item</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Create item type with bulk quantity — each unit gets a unique barcode
        </p>
      </div>

      <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="space-y-2">
            <Label htmlFor="itemName">Item Name *</Label>
            <Input id="itemName" placeholder="e.g. Dell Monitor 24 inch" value={itemName} onChange={(e) => setItemName(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label>Department *</Label>
            <Select value={department} onValueChange={(v) => setDepartment(v as DepartmentType)} required>
              <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((d) => (<SelectItem key={d} value={d}>{d}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              inputMode="numeric"
              pattern="[0-9]*"
              value={quantity}
              onChange={handleQuantityChange}
              placeholder="Enter number only"
              required
              className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price (from receipt) *</Label>
            <Input id="price" type="number" step="0.01" min={0} placeholder="0.00" value={price} onChange={(e) => setPrice(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Purchase Location *</Label>
            <Input id="location" placeholder="e.g. Office Depot" value={purchaseLocation} onChange={(e) => setPurchaseLocation(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Purchase Date *</Label>
            <Input id="date" type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} required />
          </div>
        </div>

        <Button type="submit" disabled={addItemType.isPending} className="w-full">
          <PlusCircle className="h-4 w-4 mr-2" />
          {addItemType.isPending ? "Generating..." : `Add Item & Generate ${parseInt(quantity) || 0} Barcode(s)`}
        </Button>
      </form>

      {generatedItems.length > 0 && (
        <div className="glass rounded-2xl p-8 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Generated Barcodes ({generatedItems.length})</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const itemsForPdf = generatedItems
                    .map((it) => {
                      const canvas = canvasRefs.current.get(it.barcode);
                      return canvas ? { canvas, label: `${lastItemName} – ${it.barcode}` } : null;
                    })
                    .filter(Boolean) as { canvas: HTMLCanvasElement; label: string }[];
                  const today = new Date().toISOString().slice(0, 10);
                  downloadCanvasesAsSinglePagePDF(itemsForPdf, `${lastItemName || "barcodes"}-${today}.pdf`);
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Download All as PDF
              </Button>
              <Button variant="outline" size="sm" onClick={downloadAllAsPNG}>
                <Download className="h-4 w-4 mr-2" />
                Download All PNG
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto">
            {generatedItems.map((item) => (
              <div key={item.barcode} className="bg-background rounded-xl p-4 border flex items-center gap-4">
                <canvas ref={(el) => { if (el) canvasRefs.current.set(item.barcode, el); }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{lastItemName} – {item.barcode}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs mt-1 px-2"
                    onClick={() => {
                      const canvas = canvasRefs.current.get(item.barcode);
                      if (canvas) downloadBarcodeAsPNG(canvas, item.barcode);
                    }}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    PNG
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
