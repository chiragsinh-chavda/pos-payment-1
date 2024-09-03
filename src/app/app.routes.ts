import { Routes } from '@angular/router';
import { PaymentComponent } from './payment/payment.component';
import { PaymentSuccessComponent } from './payment-success/payment-success.component';

export const routes: Routes = [
    { path: '', redirectTo: '/checkout', pathMatch: 'full' }, // Redirect root to 'checkout'
    { path: 'checkout', component: PaymentComponent },
    { path: 'success', component:  PaymentSuccessComponent},
    { path: '**', redirectTo: '/checkout' } // Redirect unknown paths to 'checkout'
];
