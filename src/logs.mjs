const list = [];
export default function logs(params) {
  function addItem(item) {
    list.push(item);
  }
  function show() {
    const str = list
      .map((item) => {
        return item.join("\n");
      })
      .join("\n\n");
    console.log(`\n${str}`);
  }

  return { addItem, show };
}
