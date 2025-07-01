import { redirect } from '@sveltejs/kit';

export function load({ cookies }) {
  const pseudo = cookies.get('session_pseudo');

  if (!pseudo) {
    throw redirect(302, '/');  // Redirige vers page d'accueil ou login
  }

  return { pseudo };
}
