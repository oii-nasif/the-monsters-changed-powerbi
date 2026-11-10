$ErrorActionPreference = "Stop"
$bin = "C:\Program Files\WindowsApps\Microsoft.MicrosoftPowerBIDesktop_2.159.883.0_x64__8wekyb3d8bbwe\bin"
$proc = Get-Process msmdsrv | Select-Object -First 1
$line = netstat -ano | Select-String "LISTENING\s+$($proc.Id)\s*$" | Select-Object -First 1
$port = (($line -split '\s+') | Where-Object { $_ -match ':\d+$' } | Select-Object -First 1) -replace '.*:', ''
[System.Reflection.Assembly]::LoadFrom((Join-Path $bin "Microsoft.PowerBI.Tabular.dll")) | Out-Null
$srv = New-Object Microsoft.AnalysisServices.Tabular.Server; $srv.Connect("localhost:$port")
$db = $srv.Databases[0]; $t = $db.Model.Tables["_Measures"]
$defs = @(
  @("Pct of People", "DIVIDE ( DISTINCTCOUNT ( 'FactFearSelection'[ResponseKey] ), CALCULATE ( DISTINCTCOUNT ( 'FactFearSelection'[ResponseKey] ), REMOVEFILTERS ( 'DimFear' ), REMOVEFILTERS ( 'FactFearSelection' ) ) )", "0%"),
  @("People", "DISTINCTCOUNT ( 'FactFearSelection'[ResponseKey] )", "0")
)
foreach ($d in $defs) { if ($t.Measures.Contains($d[0])) { $t.Measures.Remove($d[0]) | Out-Null }; $m = New-Object Microsoft.AnalysisServices.Tabular.Measure; $m.Name = $d[0]; $m.Expression = $d[1]; $m.FormatString = $d[2]; $t.Measures.Add($m) }
$db.Model.SaveChanges() | Out-Null
Write-Output "measures: $($t.Measures.Count)"; $srv.Disconnect()
