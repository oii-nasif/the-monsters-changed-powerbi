param([string]$Mode = "tables", [string]$QueryFile = "")
$ErrorActionPreference = "Stop"
$proc = Get-Process msmdsrv | Select-Object -First 1
$line = netstat -ano | Select-String "LISTENING\s+$($proc.Id)\s*$" | Select-Object -First 1
$port = (($line -split '\s+') | Where-Object { $_ -match ':\d+$' } | Select-Object -First 1) -replace '.*:', ''
$dll = Get-Item "C:\Program Files\WindowsApps\Microsoft.MicrosoftPowerBIDesktop_2.159.883.0_x64__8wekyb3d8bbwe\bin\Microsoft.PowerBI.AdomdClient.dll"
Add-Type -Path $dll.FullName
$conn = New-Object Microsoft.AnalysisServices.AdomdClient.AdomdConnection("Data Source=localhost:$port")
$conn.Open()
Write-Output "PORT=$port DB=$($conn.Database)"

$queries = @{
  tables   = 'SELECT [ID],[Name],[IsHidden] FROM $SYSTEM.TMSCHEMA_TABLES'
  columns  = 'SELECT [TableID],[ExplicitName],[ExplicitDataType],[IsHidden],[Type] FROM $SYSTEM.TMSCHEMA_COLUMNS'
  measures = 'SELECT [TableID],[Name],[Expression],[IsHidden] FROM $SYSTEM.TMSCHEMA_MEASURES'
  rels     = 'SELECT [FromTableID],[FromColumnID],[ToTableID],[ToColumnID],[IsActive],[CrossFilteringBehavior] FROM $SYSTEM.TMSCHEMA_RELATIONSHIPS'
  parts    = 'SELECT [TableID],[Name],[QueryDefinition] FROM $SYSTEM.TMSCHEMA_PARTITIONS'
}
$q = if ($QueryFile) { Get-Content -Raw $QueryFile } else { $queries[$Mode] }
$cmd = $conn.CreateCommand(); $cmd.CommandText = $q
$rdr = $cmd.ExecuteReader()
$cols = @(); for ($i = 0; $i -lt $rdr.FieldCount; $i++) { $cols += $rdr.GetName($i) }
Write-Output ($cols -join " | ")
while ($rdr.Read()) {
  $vals = @()
  for ($i = 0; $i -lt $rdr.FieldCount; $i++) { $vals += ([string]$rdr.GetValue($i)) -replace "`r?`n", " " }
  Write-Output ($vals -join " | ")
}
$rdr.Close(); $conn.Close()
