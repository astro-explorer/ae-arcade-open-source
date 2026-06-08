export let model = {
  wallet: "",
  token: "",
};

// Backup model.
const defautModel = JSON.stringify(model);

/** Resets model to default values. */
export function resetModel() {
  model = JSON.parse(defautModel);
}
