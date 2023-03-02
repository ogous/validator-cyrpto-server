import Fastify from "fastify"
import { sr25519Verify, signatureVerify } from "@polkadot/util-crypto"
import { waitReady } from "@polkadot/wasm-crypto"
import fs from "node:fs"

import { AsyncParser } from "@json2csv/node"
const fields = ["type", "value", "validation"]

const port = 8080
const server = Fastify({
  logger: true
})

server.post("/", async (req, res) => {
  const value = req.body as
    | { message: string; signature: string; publicKey: string }
    | undefined

  if (!value) {
    return res.status(400).send("Body required")
  }

  const opts = { fields, header: !fs.existsSync("results.csv") }
  const transformOpts = {}
  const asyncOpts = {}
  const parser = new AsyncParser(opts, transformOpts, asyncOpts)

  async function validate(value: string, validation: boolean) {
    const check = await parser
      .parse({ type: "sr25519Verify", value, validation })
      .promise()

    // fs.appendFileSync("results.csv", check)
    // fs.appendFileSync("results.csv", "\r\n")
    return check
  }

  try {
    const response = await signatureVerify(
      value.message,
      new Uint8Array(Buffer.from(value.signature, "base64")),
      new Uint8Array(Buffer.from(value.publicKey, "base64"))
    )

    if (response) {
      const check = await validate(JSON.stringify(value), true)

      res.status(200).send(check)
    } else {
      await validate(JSON.stringify(value), false)
      res.status(400).send("No result")
    }
  } catch (e) {
    await validate(JSON.stringify(value), false)

    res.status(400).send("No result")
  }
})

server.listen({ port, host: "0.0.0.0" }, async () => {
  console.log("server started on ", port)
  const res = await waitReady()
  console.log("CRYPTO WASM ready", res)
})
