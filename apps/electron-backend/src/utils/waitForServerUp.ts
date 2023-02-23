import { get } from "http";

function isHostUp(url: string): Promise<boolean> {
  return new Promise(resolve => {
    get(url, () => { resolve(true) })
      .on("error", () => {
        resolve(false)
      });
  });
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const waitForServerUp = async (url: string) => {
  console.log("waiting for local server...");
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const isUp = await isHostUp(url);
    if (isUp) break;
    await wait(1000);
  }
  console.log("✅ local server: up");
}

export default waitForServerUp;
