$ErrorActionPreference = "Stop"
$bin = "C:\Program Files\WindowsApps\Microsoft.MicrosoftPowerBIDesktop_2.159.883.0_x64__8wekyb3d8bbwe\bin"
$proc = Get-Process msmdsrv | Select-Object -First 1
$line = netstat -ano | Select-String "LISTENING\s+$($proc.Id)\s*$" | Select-Object -First 1
$port = (($line -split '\s+') | Where-Object { $_ -match ':\d+$' } | Select-Object -First 1) -replace '.*:', ''
$loaded = $null
foreach ($dll in @("Microsoft.PowerBI.Tabular.dll", "Microsoft.AnalysisServices.Tabular.dll", "Microsoft.AnalysisServices.Server.Tabular.dll")) {
  $p = Join-Path $bin $dll
  if (Test-Path $p) { try { $a = [System.Reflection.Assembly]::LoadFrom($p); $t = $a.GetType("Microsoft.AnalysisServices.Tabular.Server"); if ($t) { $loaded = $a; Write-Output "loaded $dll"; break } else { Write-Output "$dll has no Tabular.Server" } } catch { Write-Output "load failed $dll : $($_.Exception.Message)" } }
}
if (-not $loaded) { Write-Output "no TOM assembly usable"; exit 1 }
$srv = New-Object Microsoft.AnalysisServices.Tabular.Server
$srv.Connect("localhost:$port")
$db = $srv.Databases[0]
$t = $db.Model.Tables["_Measures"]
$defs = @(
  @("People Keeping A Childhood Fear", "CALCULATE ( DISTINCTCOUNT ( 'FactFearSelection'[ResponseKey] ), 'FactFearSelection'[IsRetained] = TRUE () )", "0"),
  @("People Keeping None", "DISTINCTCOUNT ( 'FactFearSelection'[ResponseKey] ) - [People Keeping A Childhood Fear]", "0"),
  @("Pct Keeping A Childhood Fear", "DIVIDE ( [People Keeping A Childhood Fear], DISTINCTCOUNT ( 'FactFearSelection'[ResponseKey] ) )", "0%"),
  @("Pct Keeping None", "DIVIDE ( [People Keeping None], DISTINCTCOUNT ( 'FactFearSelection'[ResponseKey] ) )", "0%"),
  @("Childhood Selections", "CALCULATE ( COUNTROWS ( 'FactFearSelection' ), 'FactFearSelection'[LifeStage] = ""Childhood"" )", "0"),
  @("Adult Selections", "CALCULATE ( COUNTROWS ( 'FactFearSelection' ), 'FactFearSelection'[LifeStage] = ""Adult"" )", "0"),
  @("Still Afraid", "CALCULATE ( COUNTROWS ( 'FactFearSelection' ), 'FactFearSelection'[LifeStage] = ""Childhood"", 'FactFearSelection'[IsRetained] = TRUE () )", "0"),
  @("Pct of People Childhood", "DIVIDE ( CALCULATE ( DISTINCTCOUNT ( 'FactFearSelection'[ResponseKey] ), 'FactFearSelection'[LifeStage] = ""Childhood"" ), CALCULATE ( DISTINCTCOUNT ( 'FactFearSelection'[ResponseKey] ), REMOVEFILTERS ( 'DimFear' ), REMOVEFILTERS ( 'FactFearSelection' ) ) )", "0%"),
  @("Pct of People Adult", "DIVIDE ( CALCULATE ( DISTINCTCOUNT ( 'FactFearSelection'[ResponseKey] ), 'FactFearSelection'[LifeStage] = ""Adult"" ), CALCULATE ( DISTINCTCOUNT ( 'FactFearSelection'[ResponseKey] ), REMOVEFILTERS ( 'DimFear' ), REMOVEFILTERS ( 'FactFearSelection' ) ) )", "0%")
)
foreach ($d in $defs) {
  if ($t.Measures.Contains($d[0])) { $t.Measures.Remove($d[0]) | Out-Null }
  $m = New-Object Microsoft.AnalysisServices.Tabular.Measure
  $m.Name = $d[0]; $m.Expression = $d[1]; $m.FormatString = $d[2]
  $t.Measures.Add($m)
}
$res = $db.Model.SaveChanges()
Write-Output "saved; measures now: $($t.Measures.Count)"
$t.Measures | ForEach-Object { Write-Output " - $($_.Name)" }
$srv.Disconnect()
