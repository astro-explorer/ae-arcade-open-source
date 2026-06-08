export let refreshMethod: any;

export function updateRefreshMethod(method: any) {
  refreshMethod = method;
}

export function refresh() {
  if (refreshMethod) {
    refreshMethod(Date.now());
  }
}
