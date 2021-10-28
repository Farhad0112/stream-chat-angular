import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  theme$ = new BehaviorSubject<Theme>('light');
  private _customLightThemeVariables: { [key: string]: string } | undefined;
  private _customDarkThemeVariables: { [key: string]: string } | undefined;
  private defaultDarkModeVariables = {
    '--bg-gradient-end': '#101214',
    '--bg-gradient-start': '#070a0d',
    '--black': '#ffffff',
    '--blue-alice': '#00193d',
    '--border': '#141924',
    '--button-background': '#ffffff',
    '--button-text': '#005fff',
    '--grey': '#7a7a7a',
    '--grey-gainsboro': '#2d2f2f',
    '--grey-whisper': '#1c1e22',
    '--modal-shadow': '#000000',
    '--overlay': '#00000066', // 66 = 40% opacity
    '--overlay-dark': '#ffffffcc', // CC = 80% opacity
    '--shadow-icon': '#00000080', // 80 = 50% opacity
    '--targetedMessageBackground': '#302d22',
    '--transparent': 'transparent',
    '--white': '#101418',
    '--white-smoke': '#13151b',
    '--white-snow': '#070a0d',
  };

  constructor() {
    this.theme$.subscribe((theme) => {
      const darkVariables = this.customDarkThemeVariables
        ? { ...this.defaultDarkModeVariables, ...this.customDarkThemeVariables }
        : this.defaultDarkModeVariables;
      const lightVariables = this.customLightThemeVariables
        ? this.customLightThemeVariables
        : {};
      if (theme === 'dark') {
        this.deleteVariables(lightVariables);
        this.setVariables(darkVariables);
      } else {
        this.deleteVariables(darkVariables);
        this.setVariables(lightVariables);
      }
    });
  }

  get customLightThemeVariables() {
    return this._customLightThemeVariables;
  }

  set customLightThemeVariables(
    variables: { [key: string]: string } | undefined
  ) {
    const prevVariables = this.customLightThemeVariables;
    this.deleteVariables(prevVariables);
    this._customLightThemeVariables = variables;
  }

  get customDarkThemeVariables() {
    return this._customDarkThemeVariables;
  }

  set customDarkThemeVariables(
    variables: { [key: string]: string } | undefined
  ) {
    const prevVariables = this.customDarkThemeVariables;
    this.deleteVariables(prevVariables);
    this._customDarkThemeVariables = variables;
  }

  private deleteVariables(variables: { [key: string]: string } | undefined) {
    if (!variables) {
      return;
    }
    Object.keys(variables).forEach((key) =>
      document.documentElement.style.setProperty(key, null)
    );
  }

  private setVariables(variables: { [key: string]: string } | undefined) {
    if (!variables) {
      return;
    }
    Object.keys(variables).forEach((key) =>
      document.documentElement.style.setProperty(key, variables[key])
    );
  }
}
