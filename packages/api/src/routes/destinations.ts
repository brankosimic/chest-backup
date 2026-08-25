import { Hono } from "hono"
import { DestinationSchema } from "../lib/validation"
import {
  createDestination,
  getDestinations,
  getDestinationUsage,
  findDestinationById,
  updateDestination,
  deleteDestination,
} from "../lib/store"
import { validateBody, notFound } from "../lib/routes"

const destinations = new Hono()

destinations.get("/", (c) => {
  const data = getDestinations()
  return c.json({ success: true, data })
})

destinations.get("/:id", (c) => {
  const id = c.req.param("id")
  const destination = findDestinationById(id)
  if (!destination) return notFound(c, "Destination")
  return c.json({ success: true, data: destination })
})

destinations.get("/:id/usage", async (c) => {
  const id = c.req.param("id")
  const usage = await getDestinationUsage(id)
  if (!usage) return notFound(c, "Destination")
  return c.json({ success: true, data: usage })
})

destinations.post("/", async (c) => {
  const result = await validateBody(DestinationSchema, c)
  if (!result.ok) return result.error
  const destination = createDestination(result.data)
  return c.json({ success: true, data: destination }, 201)
})

destinations.put("/:id", async (c) => {
  const id = c.req.param("id")
  const result = await validateBody(DestinationSchema, c)
  if (!result.ok) return result.error
  const updated = updateDestination(id, result.data)
  if (!updated) return notFound(c, "Destination")
  return c.json({ success: true, data: updated })
})

destinations.delete("/:id", (c) => {
  const id = c.req.param("id")
  const deleted = deleteDestination(id)
  if (!deleted) return notFound(c, "Destination")
  return c.json({ success: true, data: null })
})

export { destinations }
