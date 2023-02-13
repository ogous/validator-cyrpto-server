import http from "node:http"
import crypto from "node:crypto"
import stream from "node:stream"
import { sr25519Verify, signatureVerify } from "@polkadot/util-crypto"
import { waitReady } from "@polkadot/wasm-crypto"
import fs from "node:fs"

import { AsyncParser } from "@json2csv/node"
const fields = ["type", "value", "validation"]

const port = 3000
const server = http.createServer()

server.on("request", (req, res) => {
  req.on("data", async (chunk: Buffer) => {
    const decoder = new TextDecoder()

    const stringData = decoder.decode(chunk)
    const value = JSON.parse(stringData)
    const opts = { fields, header: !fs.existsSync("results.csv") }
    const transformOpts = {}
    const asyncOpts = {}
    const parser = new AsyncParser(opts, transformOpts, asyncOpts)

    async function validate(value: string, validation: boolean) {
      const check = await parser
        .parse({ type: "sr25519Verify", value, validation })
        .promise()

      fs.appendFileSync("results.csv", check)
      fs.appendFileSync("results.csv", "\r\n")
    }

    try {
      const response = await signatureVerify(
        value.message,
        new Uint8Array(Buffer.from(value.signature, "base64")),
        new Uint8Array(Buffer.from(value.publicKey, "base64"))
      )

      if (response) {
        await validate(value, true)

        res.end(JSON.stringify(response))
      } else {
        await validate(value, false)
        res.end("No result")
      }
    } catch (e) {
      await validate(value, false)

      res.end("No result")
    }
  })
})

server.listen(port, async () => {
  console.log("server started on ", port)
  const res = await waitReady()
  console.log("CRYPTO WASM ready", res)
})
