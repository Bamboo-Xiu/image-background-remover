import { auth, signIn, signOut } from "@/auth"

export async function AuthHeader() {
  const session = await auth()

  return (
    <div className="flex items-center gap-4">
      {session?.user ? (
        <>
          <div className="flex items-center gap-2">
            {session.user.image && (
              <img 
                src={session.user.image} 
                alt="Avatar" 
                className="w-8 h-8 rounded-full"
              />
            )}
            <span className="text-sm text-gray-700">{session.user.name}</span>
          </div>
          <form
            action={async () => {
              "use server"
              await signOut()
            }}
          >
            <button 
              type="submit"
              className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              登出
            </button>
          </form>
        </>
      ) : (
        <form
          action={async () => {
            "use server"
            await signIn("google")
          }}
        >
          <button 
            type="submit"
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Google 登录
          </button>
        </form>
      )}
    </div>
  )
}
