const GAP = 1000;

export function nextPosition(current: number[]) {
  if (current.length === 0) {
    return GAP;
  }
  return current[current.length - 1] + GAP;
}

export function movePosition(positions: number[], fromIndex: number, toIndex: number) {
  const copy = [...positions];
  const [value] = copy.splice(fromIndex, 1);
  copy.splice(toIndex, 0, value);
  return copy;
}
