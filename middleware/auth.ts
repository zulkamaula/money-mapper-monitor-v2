export default defineNuxtRouteMiddleware((to, from) => {
  const { isSignedIn } = useAuth()
  
  if (!isSignedIn.value) {
    return navigateTo('/')
  }
})
