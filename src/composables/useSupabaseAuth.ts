import { ref, onMounted } from 'vue'
import { supabase } from '@/supabase'

const user = ref<any>(null)

export function useSupabaseAuth() {
    const loadUser = async () => {
        const { data } = await supabase.auth.getUser()
        user.value = data?.user ?? null
    }

    const signIn = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        user.value = data.user
        return data.user
    }

    const signUp = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        user.value = data.user
        return data.user
    }

    const signOut = async () => {
        await supabase.auth.signOut()
        user.value = null
    }

    onMounted(async () => {
        await loadUser()
        // Listen to auth changes
        supabase.auth.onAuthStateChange((_event, session) => {
            user.value = session?.user ?? null
        })
    })

    return { user, signIn, signUp, signOut, loadUser }
}
