import { useState, useRef, useEffect } from "react";
import { ScanLine, Check, Plus, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useScanItem, useBulkScan, useScanLogs, type ActionType, type SemesterType } from "@/hooks/useInventory";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Constants } from "@/types/supabase";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const ACTIONS: { value: ActionType; label: string }[] = [
  { value: "damaged", label: "Mark Damaged" },
  { value: "lost", label: "Mark Lost" },
  { value: "issued", label: "Issue Out" },
  { value: "return", label: "Return" },
];

const SEMESTERS = Constants.public.Enums.semester_type;

const actionBadgeVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  damaged: "destructive",
  lost: "destructive",
  issued: "secondary",
  return: "outline",
};

export default function ScanItem() {
  const [barcode, setBarcode] = useState("");
  const [barcodes, setBarcodes] = useState<string[]>([]);
  const [action, setAction] = useState<ActionType>("damaged");
  const [semester, setSemester] = useState<SemesterType | "">("");
  const [issuedTo, setIssuedTo] = useState("");
  const [isBulk, setIsBulk] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scanItem = useScanItem();
  const bulkScan = useBulkScan();
  const { data: logs } = useScanLogs();
  const { user } = useAuth();

  const recentLogs = logs?.slice(0, 5) || [];

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const addBarcode = () => {
    if (barcode.trim() && !barcodes.includes(barcode.trim())) {
      setBarcodes([...barcodes, barcode.trim()]);
      setBarcode("");
      inputRef.current?.focus();
    }
  };

  const removeBarcode = (bc: string) => setBarcodes(barcodes.filter((b) => b !== bc));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!semester || !user) return toast.error("Semester is required");

    if (isBulk) {
      const allBarcodes = barcode.trim() ? [...barcodes, barcode.trim()] : barcodes;
      if (allBarcodes.length === 0) return;
      try {
        const results = await bulkScan.mutateAsync({ barcodes: allBarcodes, action_type: action, semester: semester as SemesterType, user_id: user.id, issued_to: issuedTo || undefined });
        const success = results.filter((r) => r.success).length;
        const failed = results.filter((r) => !r.success).length;
        toast.success(`Bulk scan: ${success} success, ${failed} failed`);
        setBarcodes([]);
        setBarcode("");
        inputRef.current?.focus();
      } catch (err: any) {
        toast.error(err.message || "Bulk scan failed");
      }
    } else {
      if (!barcode.trim()) return;
      try {
        const result = await scanItem.mutateAsync({ barcode: barcode.trim(), action_type: action, semester: semester as SemesterType, user_id: user.id, issued_to: issuedTo || undefined });
        toast.success(`${action.toUpperCase()}: ${result.item.item_types?.item_name || barcode}`);
        setBarcode("");
        inputRef.current?.focus();
      } catch (err: any) {
        toast.error(err.message || "Scan failed");
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Scan Barcode</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Scan with barcode scanner or type barcode manually
          </p>
        </div>
        <Button variant={isBulk ? "default" : "outline"} size="sm" onClick={() => setIsBulk(!isBulk)}>
          {isBulk ? "Bulk Mode ON" : "Single Mode"}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="barcode">Barcode</Label>
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="barcode" ref={inputRef} placeholder="Scan or type barcode..." value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyDown={(e) => { if (isBulk && e.key === "Enter") { e.preventDefault(); addBarcode(); } }}
                className="pl-10 font-mono" autoComplete="off" required={!isBulk || barcodes.length === 0}
              />
            </div>
            {isBulk && <Button type="button" variant="outline" size="icon" onClick={addBarcode}><Plus className="h-4 w-4" /></Button>}
          </div>
        </div>

        {isBulk && barcodes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {barcodes.map((bc) => (
              <Badge key={bc} variant="secondary" className="font-mono text-xs gap-1">
                {bc}
                <button type="button" onClick={() => removeBarcode(bc)}><X className="h-3 w-3" /></button>
              </Badge>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Action *</Label>
            <Select value={action} onValueChange={(v) => setAction(v as ActionType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ACTIONS.map((a) => (<SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Semester *</Label>
            <Select value={semester} onValueChange={(v) => setSemester(v as SemesterType)} required>
              <SelectTrigger><SelectValue placeholder="Select semester" /></SelectTrigger>
              <SelectContent>
                {SEMESTERS.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {action === "issued" && (
          <div className="space-y-2">
            <Label htmlFor="issuedTo">Issued To</Label>
            <Input id="issuedTo" placeholder="e.g. John Doe" value={issuedTo} onChange={(e) => setIssuedTo(e.target.value)} />
          </div>
        )}

        <Button type="submit" disabled={scanItem.isPending || bulkScan.isPending} className="w-full">
          <Check className="h-4 w-4 mr-2" />
          {scanItem.isPending || bulkScan.isPending ? "Processing..." : isBulk ? `Submit ${barcodes.length + (barcode.trim() ? 1 : 0)} Scans` : "Submit Scan"}
        </Button>
      </form>

      {/* Recent Scans */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <h3 className="font-semibold">Recent Scans</h3>
        {recentLogs.length > 0 ? (
          <div className="space-y-3">
            {recentLogs.map((log: any) => (
              <div key={log.id} className="flex items-center justify-between bg-background rounded-xl p-3 border text-sm">
                <div className="space-y-0.5">
                  <p className="font-mono text-xs">Barcode: {log.items?.barcode || "—"}</p>
                  <p className="text-muted-foreground text-xs">
                    Action: <Badge variant={actionBadgeVariant[log.action_type] || "default"} className="text-[10px] ml-1">{log.action_type}</Badge>
                    <span className="ml-3">Semester: {log.semester}</span>
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">{format(new Date(log.scan_time), "MMM dd, yyyy – hh:mm a")}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No scans yet.</p>
        )}
      </div>
    </div>
  );
}
