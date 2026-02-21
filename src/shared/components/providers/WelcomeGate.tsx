import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAppStore } from "@/state/app.store";
import LogoMark from "@/shared/components/ui/LogoMark";

const SEEN_KEY = "app.welcomeSeen.v1";

export default function WelcomeGate() {
    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(false);

    const setWelcomeSeen = useAppStore((s) => s.setWelcomeSeen);
    const welcomeSeen = useAppStore((s) => s.welcomeSeen);

    function markSeen() {
        try {
            localStorage.setItem(SEEN_KEY, "1");
        } catch { }
        setWelcomeSeen(true);
        setShow(false);
    }

    useEffect(() => {
        let mounted = true;

        async function boot() {
            if (welcomeSeen) return;

            const seen = localStorage.getItem(SEEN_KEY) === "1";

            const { data } = await supabase.auth.getSession();
            const hasSession = !!data.session;

            if (!mounted) return;

            if (hasSession) {
                markSeen();
                return;
            }

            if (!seen) setShow(true);
        }

        boot();

        const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "SIGNED_IN" && session) {
                setLoading(false);
                markSeen();
            }
        });

        return () => {
            mounted = false;
            sub.subscription.unsubscribe();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [welcomeSeen]);

    async function signInWithGoogle() {
        if (!navigator.onLine) return;
        setLoading(true);

        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: window.location.origin,
                queryParams: {
                    prompt: "select_account",
                },
            },
        });

        if (error) setLoading(false);
    }

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 bg-gray-50">
            <div className="mx-auto flex min-h-dvh max-w-md flex-col px-6">
                {/* Top section with logo and title */}
                <div className="flex flex-1 flex-col items-center justify-center pt-16">
                    {/* Logo */}
                    <div className="mb-6">
                        <LogoMark size={64} />
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                        Welcome to
                    </h1>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                        BaselineApp
                    </h1>

                    {/* Subtitle */}
                    <p className="mt-6 text-center text-base text-gray-500">
                        Controla tus finanzas.
                    </p>
                    <p className="text-center text-base text-gray-500">
                        Simple y efectivo.
                    </p>
                </div>

                {/* Buttons section */}
                <div className="pb-12">
                    {/* Google button */}
                    <button
                        type="button"
                        onClick={signInWithGoogle}
                        disabled={loading || !navigator.onLine}
                        className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3.5 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 transition-all hover:bg-gray-50 active:scale-[0.98] disabled:opacity-60"
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        {loading ? "Conectando..." : "Continuar con Google"}
                    </button>

                    {/* Guest button */}
                    <button
                        type="button"
                        onClick={markSeen}
                        className="mt-3 flex w-full items-center justify-center gap-3 rounded-xl bg-gray-100 px-4 py-3.5 text-sm font-medium text-gray-600 transition-all hover:bg-gray-200 active:scale-[0.98]"
                    >
                        Continuar como invitado
                    </button>

                    {/* Offline message */}
                    {!navigator.onLine && (
                        <p className="mt-4 text-center text-xs text-gray-400">
                            Sin conexión. Puedes continuar como invitado.
                        </p>
                    )}

                    {/* Footer note */}
                    <p className="mt-8 text-center text-xs text-gray-400">
                        Tus datos se guardan localmente en tu dispositivo.
                    </p>
                </div>
            </div>
        </div>
    );
}
