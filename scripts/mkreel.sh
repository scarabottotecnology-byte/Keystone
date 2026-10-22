#!/bin/bash
# Reel 1080×1920 a partir de slides 1080×1350 do render-post (4 s por slide, transição de 0,5 s, áudio mudo).
# uso: scripts/mkreel.sh saida.mp4 slide1.jpg slide2.jpg ...
set -e
out=$1; shift
D=4; F=0.5; FPS=30
inputs=(); filters=""; n=0
for img in "$@"; do
  inputs+=(-loop 1 -t $D -i "$img")
  filters+="[$n:v]scale=1080:1350,zoompan=z='min(zoom+0.0004,1.035)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=$((D*FPS)):s=1080x1350:fps=$FPS,pad=1080:1920:0:170:color=0x0B0F1C,setsar=1,format=yuv420p[v$n];"
  n=$((n+1))
done
prev="v0"; off=0
for ((i=1;i<n;i++)); do
  off=$(python3 -c "print(round($i*($D-$F),3))")
  filters+="[$prev][v$i]xfade=transition=fade:duration=$F:offset=$off[x$i];"
  prev="x$i"
done
total=$(python3 -c "print(round($n*$D-($n-1)*$F,3))")
ffmpeg -y -v error "${inputs[@]}" -f lavfi -t $total -i anullsrc=r=44100:cl=stereo \
  -filter_complex "${filters%;}" -map "[$prev]" -map $n:a \
  -c:v libx264 -profile:v high -preset medium -crf 21 -r $FPS -pix_fmt yuv420p \
  -c:a aac -b:a 128k -shortest -movflags +faststart "$out"
ffprobe -v error -show_entries format=duration,size:stream=codec_name,width,height,r_frame_rate -of compact "$out"
