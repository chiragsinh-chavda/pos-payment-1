import { Component, OnInit } from '@angular/core';
import { loadStripe, Stripe, StripeElements, Appearance, StripePaymentElementOptions } from '@stripe/stripe-js';
import { environment } from '../environments/environment';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [],
  templateUrl: './payment-success.component.html',
  styleUrl: './payment-success.component.scss'
})
export class PaymentSuccessComponent implements OnInit {

  stripe: any = null;
  paymentIntent: any = null;
  paymentIntentClientSecret: any = null;
  redirectStatus: any = null;
  paymentData : any = null;

  constructor(
    private activatedRoute: ActivatedRoute,
    private httpClient: HttpClient,
  ) { }

  async ngOnInit() {
    // Initialize Stripe
    this.stripe = loadStripe(environment.STRIPE_PUBLISHABLE_KEY);
    this.activatedRoute.queryParams.subscribe(params => {
      this.paymentIntent = params['payment_intent'];
      this.paymentIntentClientSecret = params['payment_intent_client_secret'];
      this.redirectStatus = params['redirect_status'];
    });

    if (this.paymentIntentClientSecret) {
      this.getPaymentIntent();
    }
  }

  async getPaymentIntent() {
    try {
      if (this.paymentIntent) {
        this.httpClient.get(`${environment.serverUrl}/posapi/payment-intent/${this.paymentIntent}`).subscribe((res: any) => {
          if (res) {
            this.paymentData = res
          }
        })
      }
    } catch (error) {
      console.error(error)
    }
  }

}
