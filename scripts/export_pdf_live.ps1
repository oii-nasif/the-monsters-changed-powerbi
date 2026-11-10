param([string]$OutPdf = "D:\Projects\SpookySeason\build\The Monsters Changed - Live.pdf")
# Drives File > Export > PDF in the Power BI Desktop instance that has the "Live" file open (UI Automation).
# Refuses to send any keystrokes unless Desktop really is the foreground window.
Add-Type -AssemblyName UIAutomationClient, UIAutomationTypes, System.Windows.Forms
Add-Type @"
using System; using System.Runtime.InteropServices;
public class W4 {
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int c);
}
"@
$p = Get-Process PBIDesktop | Where-Object { $_.MainWindowHandle -ne 0 -and $_.MainWindowTitle -like "*Live*" } | Select-Object -First 1
if (-not $p) { Write-Output "no Live window"; exit 1 }
$h = $p.MainWindowHandle
[W4]::ShowWindow($h, 3) | Out-Null
[W4]::SetForegroundWindow($h) | Out-Null
Start-Sleep -Milliseconds 800
if ([W4]::GetForegroundWindow() -ne $h) { Write-Output "ABORT: Desktop is not the foreground window"; exit 2 }
$root = [System.Windows.Automation.AutomationElement]::FromHandle($h)

function FindByName($el, $name, $timeoutSec = 10) {
  $cond = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::NameProperty, $name)
  $deadline = (Get-Date).AddSeconds($timeoutSec)
  do {
    $f = $el.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $cond)
    if ($f) { return $f }
    Start-Sleep -Milliseconds 400
  } while ((Get-Date) -lt $deadline)
  return $null
}
function Click($el) {
  $pat = $null
  if ($el.TryGetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern, [ref]$pat)) { $pat.Invoke(); return "invoked" }
  if ($el.TryGetCurrentPattern([System.Windows.Automation.SelectionItemPattern]::Pattern, [ref]$pat)) { $pat.Select(); return "selected" }
  $r = $el.Current.BoundingRectangle
  [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point([int]($r.X + $r.Width/2), [int]($r.Y + $r.Height/2))
  Add-Type @"
using System; using System.Runtime.InteropServices;
public class M4 { [DllImport("user32.dll")] public static extern void mouse_event(uint f, int x, int y, int d, IntPtr e); }
"@
  [M4]::mouse_event(0x0002,0,0,0,[IntPtr]::Zero); [M4]::mouse_event(0x0004,0,0,0,[IntPtr]::Zero)
  return "clicked"
}
function AssertForeground() { if ([W4]::GetForegroundWindow() -ne $h) { Write-Output "ABORT: lost foreground"; exit 2 } }

$file = FindByName $root "File" 5
if (-not $file) { Write-Output "File tab not found"; exit 1 }
Write-Output "File: $(Click $file)"
Start-Sleep -Milliseconds 1500
$export = FindByName $root "Export" 8
if (-not $export) { Write-Output "Export not found"; exit 1 }
Write-Output "Export: $(Click $export)"
Start-Sleep -Milliseconds 1500
$pdf = FindByName $root "Export to PDF" 8
if (-not $pdf) { $pdf = FindByName $root "PDF" 5 }
if (-not $pdf) { Write-Output "Export to PDF not found"; exit 1 }
Write-Output "PDF: $(Click $pdf)"
# Save dialog: type the path and press Enter (the dialog belongs to the Desktop process)
Start-Sleep -Milliseconds 4000
$fg = [W4]::GetForegroundWindow()
$fgProc = (Get-Process | Where-Object { $_.MainWindowHandle -eq $fg } | Select-Object -First 1)
if ($fgProc -and $fgProc.ProcessName -ne "PBIDesktop") { Write-Output "ABORT: save dialog not in front ($($fgProc.ProcessName))"; exit 2 }
[System.Windows.Forms.SendKeys]::SendWait("^a")
[System.Windows.Forms.SendKeys]::SendWait($OutPdf.Replace("(", "{(}").Replace(")", "{)}"))
Start-Sleep -Milliseconds 500
[System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
Start-Sleep -Milliseconds 3000
# overwrite prompt, if any
[System.Windows.Forms.SendKeys]::SendWait("y")
$deadline = (Get-Date).AddSeconds(90)
while (-not (Test-Path $OutPdf) -and (Get-Date) -lt $deadline) { Start-Sleep -Milliseconds 1000 }
if (-not (Test-Path $OutPdf)) {
  # Desktop may skip the save dialog and drop the PDF in a print-job folder (then open it in the browser)
  $job = Get-ChildItem (Join-Path $env:TEMP "Power BI Desktop") -Filter *.pdf -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.LastWriteTime -gt (Get-Date).AddMinutes(-5) } | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if ($job) { Copy-Item $job.FullName $OutPdf -Force; Write-Output "copied from print job: $($job.FullName)" }
}
if (Test-Path $OutPdf) { Write-Output "PDF written: $((Get-Item $OutPdf).Length) bytes" } else { Write-Output "PDF not found after wait" }
