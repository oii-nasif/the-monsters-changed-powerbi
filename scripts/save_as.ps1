param([string]$OutPbix = "D:\Projects\SpookySeason\build\base_measures.pbix")
Add-Type -AssemblyName UIAutomationClient, UIAutomationTypes, System.Windows.Forms
Add-Type @"
using System; using System.Runtime.InteropServices;
public class W7 { [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h); }
"@
if (Test-Path $OutPbix) { Remove-Item $OutPbix -Force }
$p = Get-Process PBIDesktop | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
[W7]::SetForegroundWindow($p.MainWindowHandle) | Out-Null
Start-Sleep -Milliseconds 800
$root = [System.Windows.Automation.AutomationElement]::FromHandle($p.MainWindowHandle)
function FindByName($el, $name, $timeoutSec = 10) {
  $cond = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::NameProperty, $name)
  $deadline = (Get-Date).AddSeconds($timeoutSec)
  do { $f = $el.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $cond); if ($f) { return $f }; Start-Sleep -Milliseconds 400 } while ((Get-Date) -lt $deadline)
  return $null
}
function Click($el) {
  $pat = $null
  if ($el.TryGetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern, [ref]$pat)) { $pat.Invoke(); return "invoked" }
  if ($el.TryGetCurrentPattern([System.Windows.Automation.SelectionItemPattern]::Pattern, [ref]$pat)) { $pat.Select(); return "selected" }
  return "no pattern"
}
$file = FindByName $root "File" 5; Write-Output "File: $(Click $file)"; Start-Sleep -Milliseconds 1500
$sa = FindByName $root "Save as" 8; if (-not $sa) { $sa = FindByName $root "Save As" 3 }
if (-not $sa) { Write-Output "Save as not found"; exit 1 }
Write-Output "Save as: $(Click $sa)"; Start-Sleep -Milliseconds 2500
# Browse button may be needed in the backstage; try it
$browse = FindByName $root "Browse this device" 4
if ($browse) { Write-Output "Browse: $(Click $browse)"; Start-Sleep -Milliseconds 2500 }
[System.Windows.Forms.SendKeys]::SendWait("^a"); Start-Sleep -Milliseconds 200
[System.Windows.Forms.SendKeys]::SendWait($OutPbix); Start-Sleep -Milliseconds 400
[System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
$deadline = (Get-Date).AddSeconds(90)
while (-not (Test-Path $OutPbix) -and (Get-Date) -lt $deadline) { Start-Sleep -Milliseconds 1000 }
Start-Sleep -Seconds 5
if (Test-Path $OutPbix) { Write-Output "saved: $((Get-Item $OutPbix).Length) bytes" } else { Write-Output "not saved" }
Write-Output "title: $((Get-Process PBIDesktop|?{$_.MainWindowHandle -ne 0}|select -First 1).MainWindowTitle)"
