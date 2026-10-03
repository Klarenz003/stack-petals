Add-Type -AssemblyName System.Drawing
$taskBitmap=[System.Drawing.Bitmap]::new((Join-Path $PSScriptRoot '../public/images/town/chibi-poses-approved.png'))
$taskColumns=@(0,290,550,790,1035,1290,1536)
$taskRows=@(0,304,556,798,1024)
try {
  for($row=0;$row -lt 4;$row++) { for($col=0;$col -lt 6;$col++) {
    $left=1536;$top=1024;$right=-1;$bottom=-1
    for($y=$taskRows[$row];$y -lt $taskRows[$row+1];$y++){for($x=$taskColumns[$col];$x -lt $taskColumns[$col+1];$x++){
      if($taskBitmap.GetPixel($x,$y).A -ge 16){$left=[Math]::Min($left,$x);$top=[Math]::Min($top,$y);$right=[Math]::Max($right,$x);$bottom=[Math]::Max($bottom,$y)}
    }}
    "row=$row col=$col [$left,$top,$($right-$left+1),$($bottom-$top+1)]"
  }}
} finally {$taskBitmap.Dispose()}
