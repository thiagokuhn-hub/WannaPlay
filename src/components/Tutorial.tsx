import React, { useState, useEffect } from 'react';
import Joyride, { Step } from 'react-joyride';

interface TutorialProps {
  initialDelay?: number;
  force?: boolean;
  onClose?: () => void;  // Add this prop
}

export default function Tutorial({ initialDelay = 5000, force = false, onClose }: TutorialProps) {
  const [run, setRun] = useState(false);

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('tutorialComplete');
    
    if (!hasSeenTutorial || force) {
      const timer = setTimeout(() => {
        setRun(true);
      }, initialDelay);
      
      return () => clearTimeout(timer);
    }
  }, [initialDelay, force]);

  const steps: Step[] = [
    {
      target: '.availability-button',
      content: 'Bem vindo ao QueroJogar! Neste botão você diz em que dias e horários na semana você pode jogar, assim outros jogadores podem saber e te contatar.',
      placement: 'bottom',
      disableBeacon: true
    },
    {
      target: '.propose-game-button',
      content: 'Aqui você cadastra um jogo e jogadores podem se increver para jogar com você.',
      placement: 'bottom'
    },
    {
      target: '.games-section',  // Changed from '.games-list' to '.games-section'
      content: 'Aqui você encontra todos jogos que estão esperando jogadores e pode convidar jogadores para fechar os jogos',
      placement: 'top',
      disableBeacon: true
    },
    {
      target: '.availability-section',
      content: 'Aqui você consegue visualizar os jogadores que estão querendo jogar. Mas lembre-se de usar o filtro para facilitar a busca.',
      placement: 'right'
    },
    {
      target: '.filter-button',
      content: 'Use o filtro para facilita a busca!',
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
          onClose?.();  // Call onClose when tutorial is finished or skipped
        }
      }}
    />
  );
}