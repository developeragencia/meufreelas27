import { FilePlus, Users, ShieldCheck } from 'lucide-react';

interface StepProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function Step({ icon, title, description }: StepProps) {
  return (
    <div className="text-center px-6 animate-fade-in-up">
      <div className="inline-flex items-center justify-center w-16 h-16 mb-6 text-99blue">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-3">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

export default function HowItWorks() {
  const steps = [
    {
      icon: <FilePlus className="w-12 h-12" strokeWidth={1.5} />,
      title: 'Publique uma vaga',
      description: 'Publique a sua vaga para milhares de profissionais, você irá receber propostas de freelancers talentosos em poucos minutos.',
    },
    {
      icon: <Users className="w-12 h-12" strokeWidth={1.5} />,
      title: 'Contrate',
      description: 'Reveja o histórico de trabalho, feedback de clientes e portfólio para limitar os candidatos. Então faça uma entrevista pelo chat e escolha o melhor.',
    },
    {
      icon: <ShieldCheck className="w-12 h-12" strokeWidth={1.5} />,
      title: 'Pague com segurança',
      description: 'Com o pagamento seguro do MeuFreelas, o pagamento será repassado para o freelancer somente quando o projeto estiver concluído.',
    },
  ];

  return (
    <section className="bg-white py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-light text-gray-800 mb-4">
            Como Funciona?
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Anuncie o seu trabalho facilmente, contrate freelancers e pague com segurança.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <Step key={index} {...step} />
          ))}
        </div>
      </div>
    </section>
  );
}
