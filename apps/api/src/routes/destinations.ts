import { Hono } from "hono"
import { DestinationSchema } from "../lib/validation"
import { createDestination, getDestinations, updateDestination, deleteDestination } from "../lib/store"

const destinations = new Hono()

destinations.get("/", (c) => {
  const data = getDestinations()
  return c.json({ success: true, data })
})

destinations.post("/", (c) => {
  const body = c.req.jsonSync()
  const result = DestinationSchema.safeParse(body)

  if (!result.success) {
    return c.json({ success: false, error: "Validation failed", message: result.error.issues[0]?.message }, 400)
  }

  const destination = createDestination(result.data)
  return c.json({ success: true, data: destination }, 201)
})

destinations.put("/:id", (c) => {
  const id = c.req.param("id")
  const body = c.req.jsonSync()

  const updated = updateDestination(id, body)
  if (!updated) {
    return c.json({ success: false, error: "Destination not found" }, 404)
  }

  return c.json({ success: true, data: updated })
})

destinations.delete("/:id", (c) => {
  const id = c.req.param("id")
  const deleted = deleteDestination(id)

  if (!deleted) {
    return c.json({ success: false, error: "Destination not found" }, 404)
  }

  return c.json({ success: true, message: "Destination deleted" })
})

export { destinations }
