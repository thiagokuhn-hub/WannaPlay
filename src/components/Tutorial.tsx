import React, { useState, useEffect } from 'react';
import Joyride, { Step } from 'react-joyride';

interface TutorialProps {
  initialDelay?: number;
}

export default function Tutorial({ initialDelay = 5000 }: TutorialProps) {
  const [run, setRun] = useState(false);

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('tutorialComplete');
    
    if (!hasSeenTutorial) {
      const timer = setTimeout(() => {
        setRun(true);
      }, initialDelay);
      
      return () => clearTimeout(timer);
    }
  }, [initialDelay]);

  const steps: Step[] = [
    {
      target: '.availability-button',
      content: 'Bem vindo ao QueroJogar! Neste botão você diz em que dias e horários você pode jogar durante a semana assim outros jogadores podem saber e te contatar.',
      placement: 'bottom',
      disableBeacon: true
    },
    {
      target: '.propose-game-button',
      content: 'Aqui você cadastra um jogo e jogadores podem se increver para jogar com você.',
      placement: 'bottom'
    },
    {
      target: '.games-list',
      content: 'Área de jogos disponíveis: Aqui você encontra todos jogos que estão esperando jogadores.',
      placement: 'left'
    },
    {
      target: '.availability-section',
      content: 'Área de disponibilidade: Aqui você consegue visualizar os jogadores que estão querendo jogar. Mas lembre de usar o filtro para facilitar a busca.',
      placement: 'right'
    },
    {
      target: '.filter-button',
      content: 'Use o filtro para localizar mais facilmente o que procura.',
      placement: 'bottom'
    }
  ];

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      disableOverlayClose
      disableScrolling={false}
      spotlightClicks
      styles={{
        options: {
          primaryColor: '#2563eb',
          textColor: '#111827',
          zIndex: 10000,
        }
      }}
      locale={{
        back: 'Anterior',
        close: 'Fechar',
        last: 'Finalizar',
        next: 'Próximo',
        skip: 'Pular'
      }}
      callback={({ status }) => {
        console.log('Tutorial status:', status);
        if (['finished', 'skipped'].includes(status)) {
          setRun(false);
          localStorage.setItem('tutorialComplete', 'true');
        }
      }}
    />
  );
}