export default function FreelancerBanner() {
  return (
    <section className="bg-99dark py-3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-white text-sm">
          Você é um freelancer? Junte-se a nós!{' '}
          <a 
            href="#" 
            className="text-white hover:text-gray-200 font-medium underline underline-offset-2 transition-colors"
          >
            Cadastre-se
          </a>
          .
        </p>
      </div>
    </section>
  );
}
