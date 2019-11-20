"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APP_MODULE = `import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { CoreModule, BootstrapComponent } from '@c8y/ngx-components';

@NgModule({
  imports: [
    BrowserModule,
    AppRoutingModule,
    CoreModule
  ],
  providers: [],
  bootstrap: [BootstrapComponent]
})
export class AppModule { }`;
//# sourceMappingURL=app-module.js.map