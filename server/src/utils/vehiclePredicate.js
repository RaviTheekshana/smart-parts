export default function vehiclePredicate(v = {}) {
  const q = {};
  for (const k of ["make","model","engine","transmission","trim"]) {
    if (v[k]) q[k] = v[k];
  }
  if (v.year) q.year = v.year;
  return q;
}
