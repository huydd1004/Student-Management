self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = event.notification.data?.url
  if (!targetUrl) return

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        const targetOrigin = new URL(targetUrl).origin
        const existingClient = windowClients.find(
          (client) => new URL(client.url).origin === targetOrigin,
        )

        if (existingClient) {
          return existingClient.navigate(targetUrl).then(() =>
            existingClient.focus(),
          )
        }

        return self.clients.openWindow(targetUrl)
      }),
  )
})
