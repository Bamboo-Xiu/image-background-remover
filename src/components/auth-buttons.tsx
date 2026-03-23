import { signIn, signOut, auth } from "@/auth"

export async function SignIn() {
  return (
    <form
      action={async () => {
        "use server"
        await signIn("google")
      }}
    >
      <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        Sign in with Google
      </button>
    </form>
  )
}

export async function SignOut() {
  return (
    <form
      action={async () => {
        "use server"
        await signOut()
      }}
    >
      <button type="submit" className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
        Sign Out
      </button>
    </form>
  )
}

export async function UserInfo() {
  const session = await auth()
  
  if (!session?.user) return null
  
  return (
    <div className="flex items-center gap-4">
      {session.user.image && (
        <img src={session.user.image} alt="Avatar" className="w-8 h-8 rounded-full" />
      )}
      <span>{session.user.name}</span>
      <SignOut />
    </div>
  )
}
