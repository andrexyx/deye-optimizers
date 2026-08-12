const $ = id => document.getElementById(id);
async function refresh() {
  const data = await chrome.storage.session.get(["token", "stations"]);
  const ready = Boolean(data.token && data.stations?.length);
  $("waiting").hidden = ready; $("ready").hidden = !ready;
  if (!ready) return;
  $("token").value = data.token;
  $("stations").replaceChildren(...data.stations.map(id => {
    const option = document.createElement("option"); option.value = option.textContent = id; return option;
  }));
}
$("open").onclick = () => chrome.runtime.sendMessage({type:"openDeye"});
$("clear").onclick = async () => { await chrome.runtime.sendMessage({type:"clear"}); $("status").textContent="Sensitive data cleared."; refresh(); };
$("reveal").onclick = () => { $("token").type="text"; setTimeout(() => $("token").type="password", 8000); };
document.querySelectorAll("[data-copy]").forEach(button => button.onclick = async () => {
  const field = $(button.dataset.copy); await navigator.clipboard.writeText(field.value);
  const old = button.textContent; button.textContent="Copied"; setTimeout(() => button.textContent=old, 1000);
});
refresh();
