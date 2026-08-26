import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const MCFARLAND_STANDARDS = [
  { standard: "0.5", cellDensity: "1.5 x 10⁸ CFU/mL", bacl2: "0.05 mL", h2so4: "9.95 mL" },
  { standard: "1", cellDensity: "3.0 x 10⁸ CFU/mL", bacl2: "0.1 mL", h2so4: "9.9 mL" },
  { standard: "2", cellDensity: "6.0 x 10⁸ CFU/mL", bacl2: "0.2 mL", h2so4: "9.8 mL" },
  { standard: "3", cellDensity: "9.0 x 10⁸ CFU/mL", bacl2: "0.3 mL", h2so4: "9.7 mL" },
  { standard: "4", cellDensity: "1.2 x 10⁹ CFU/mL", bacl2: "0.4 mL", h2so4: "9.6 mL" },
  { standard: "5", cellDensity: "1.5 x 10⁹ CFU/mL", bacl2: "0.5 mL", h2so4: "9.5 mL" },
]

export function McFarlandReference() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>McFarland Turbidity Standards</CardTitle>
        <CardDescription>Reference values for approximate bacterial cell density by standard.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Standard</TableHead>
                <TableHead>Approx. cell density</TableHead>
                <TableHead>1% BaCl₂</TableHead>
                <TableHead>1% H₂SO₄</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MCFARLAND_STANDARDS.map((row) => (
                <TableRow key={row.standard}>
                  <TableCell className="font-medium">{row.standard}</TableCell>
                  <TableCell>{row.cellDensity}</TableCell>
                  <TableCell>{row.bacl2}</TableCell>
                  <TableCell>{row.h2so4}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Values are standard reference approximations and can vary by organism and instrument; always verify
          against your laboratory's validated method.
        </p>
      </CardContent>
    </Card>
  )
}
