D=$( cloc backend/ public/ index.js tools views )
NUMS=$( echo "$D" | tail -2 | head -1 )
O=$(echo "$NUMS" | awk '{ print $2" "$3" "$4" "$5 }')
SUM=0
for i in $O; do
	SUM=$(( $SUM + $i ))
done
echo "Total size: $SUM"


