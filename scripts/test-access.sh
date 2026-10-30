#!/usr/bin/env bash
# Access-control smoke test: two separate browsers (cookie jars) against a running server.
# Usage: scripts/test-access.sh [base-url]   (defaults to http://localhost:3000)
B=${1:-http://localhost:3000}
T=$(mktemp -d); A_JAR=$T/a; B_JAR=$T/b
code() { curl -s -o /dev/null -w '%{http_code}' -m 60 "$@"; }
fail=0
check() { # name, got, want
  if [ "$2" = "$3" ]; then printf "  ok   %-34s %s\n" "$1" "$2"; else printf "  FAIL %-34s got %s, want %s\n" "$1" "$2" "$3"; fail=1; fi
}

curl -s -m 60 -c $A_JAR -X POST $B/api/clinics -H 'content-type: application/json' -d '{"clinicName":"Alice Dental"}' > $T/a.json
A=$(node -pe 'JSON.parse(require("fs").readFileSync(process.argv[1])).id' $T/a.json)
curl -s -m 60 -c $B_JAR -X POST $B/api/clinics -H 'content-type: application/json' -d '{"clinicName":"Bob Dental"}' > $T/b.json
echo "Alice's clinic: $A"
grep -q HttpOnly $A_JAR && echo "  ok   owner cookie is HttpOnly" || { echo "  FAIL owner cookie not HttpOnly"; fail=1; }

check "Alice reads her clinic"      "$(code -b $A_JAR $B/api/clinics/$A)" 200
check "no cookie reads Alice"       "$(code $B/api/clinics/$A)" 403
check "Bob reads Alice"             "$(code -b $B_JAR $B/api/clinics/$A)" 403
check "Bob PATCHes Alice"           "$(code -b $B_JAR -X PATCH $B/api/clinics/$A -H 'content-type: application/json' -d '{"card":{}}')" 403
check "Bob approves Alice"          "$(code -b $B_JAR -X POST $B/api/clinics/$A/approve -H 'content-type: application/json' -d '{"card":{}}')" 403
check "Bob asks interview session"  "$(code -b $B_JAR -X POST $B/api/clinics/$A/interview)" 403
check "Bob coaches Alice"           "$(code -b $B_JAR -X POST $B/api/clinics/$A/coach -H 'content-type: application/json' -d '{}')" 403
check "Bob refines Alice"           "$(code -b $B_JAR -X POST $B/api/clinics/$A/refine -H 'content-type: application/json' -d '{}')" 403
check "Bob reads Alice's calls"     "$(code -b $B_JAR $B/api/clinics/$A/calls)" 403
check "forged owner cookie"         "$(code -H "cookie: munshi_$A=deadbeef" $B/api/clinics/$A)" 403
check "no cookie lists voices"      "$(code $B/api/voices)" 403
check "no cookie uses speech-to-text" "$(code -X POST $B/api/stt)" 403
check "Alice lists voices"          "$(code -b $A_JAR $B/api/voices)" 200
check "tools without shared header" "$(code -X POST $B/api/tools/$A/check-slots -H 'content-type: application/json' -d '{"date":"2026-11-05"}')" 401
check "public session while not live" "$(code -X POST $B/api/public/$A/session)" 409
check "malformed clinic id"         "$(code -b $A_JAR $B/api/clinics/not-an-id)" 404

LIST=$(curl -s -b $A_JAR $B/api/clinics)
echo "$LIST" | grep -q "Alice Dental" && ! echo "$LIST" | grep -q "Bob Dental" && echo "  ok   list shows only Alice's clinics" || { echo "  FAIL list leaks other clinics: $LIST"; fail=1; }
check "no-cookie list is empty"     "$(curl -s $B/api/clinics)" "[]"

for h in x-content-type-options referrer-policy permissions-policy x-frame-options; do
  curl -sI $B/ | grep -qi "^$h:" && echo "  ok   header $h" || { echo "  FAIL missing header $h"; fail=1; }
done
curl -sI $B/ | grep -qi "^x-powered-by" && { echo "  FAIL x-powered-by exposed"; fail=1; } || echo "  ok   x-powered-by hidden"

rm -rf $T
[ $fail = 0 ] && echo "ALL ACCESS CHECKS PASSED" || echo "SOME CHECKS FAILED"
exit $fail
