import { Hono } from "hono"
import { DestinationSchema } from "../lib/validation"
import { createDestination, getDestinations, updateDestination, deleteDestination } from "../lib/store"
import { validateBody, notFound } from "../lib/routes"

const destinations = new Hono()

destinations.get("/", (c) => {
  const data = getDestinations()
  return c.json({ success: true, data })
})

destinations.post("/", (c) => {
  const result = validateBody(DestinationSchema, c)
  if (!result.ok) return result.error
  const destination = createDestination(result.data)
  return c.json({ success: true, data: destination }, 201)
})

destinations.put("/:id", (c) => {
  const id = c.req.param("id")
  const result = validateBody(DestinationSchema, c)
  if (!result.ok) return result.error
  const updated = updateDestination(id, result.data)
  if (!updated) return notFound(c, "Destination")
  return c.json({ success: true, data: updated })
})

destinations.delete("/:id", (c) => {
  const id = c.req.param("id")
  const deleted = deleteDestination(id)
  if (!deleted) return notFound(c, "Destination")
  return c.json({ success: true, message: "Destination deleted" })
})

export { destinations }
