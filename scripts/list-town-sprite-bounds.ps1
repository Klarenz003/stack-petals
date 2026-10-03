param([string]$TaskAtlasPath = (Join-Path $PSScriptRoot '../public/images/town/sprite-atlas-clean.png'))
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Collections.Generic;
public static class TownAlphaBounds {
  public static void Audit(string path) {
    using (var bitmap = new Bitmap(path)) {
      int w = bitmap.Width, h = bitmap.Height;
      var seen = new bool[w*h];
      var opaque = new bool[w*h];
      for(int y=0;y<h;y++) for(int x=0;x<w;x++) opaque[y*w+x] = bitmap.GetPixel(x,y).A >= 16;
      for(int start=0;start<w*h;start++) {
        if(seen[start] || !opaque[start]) continue;
        var queue=new Queue<int>();queue.Enqueue(start);seen[start]=true;
        int left=w,top=h,right=0,bottom=0,count=0;
        while(queue.Count>0) {
          int p=queue.Dequeue(), x=p%w,y=p/w;count++;
          left=Math.Min(left,x);right=Math.Max(right,x);top=Math.Min(top,y);bottom=Math.Max(bottom,y);
          for(int dy=-1;dy<=1;dy++) for(int dx=-1;dx<=1;dx++) {
            int nx=x+dx,ny=y+dy;
            if(nx<0||ny<0||nx>=w||ny>=h)continue;
            int next=ny*w+nx;
            if(!seen[next]&&opaque[next]){seen[next]=true;queue.Enqueue(next);}
          }
        }
        if(count>500) Console.WriteLine("[{0},{1},{2},{3}] area={4}",left,top,right-left+1,bottom-top+1,count);
      }
    }
  }
}
'@
[TownAlphaBounds]::Audit($TaskAtlasPath)
