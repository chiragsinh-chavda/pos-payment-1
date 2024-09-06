import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { CurrencyPipe } from '@angular/common';

import { routes } from './app.routes';
import { LocalStorageService } from './local-storage.service';

export const appConfig: ApplicationConfig = {
  providers: [ provideRouter(routes), provideHttpClient(), CurrencyPipe, LocalStorageService]
};
