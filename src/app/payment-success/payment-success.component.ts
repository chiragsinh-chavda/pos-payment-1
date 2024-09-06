import { Component, OnInit } from '@angular/core';
import { loadStripe, Stripe, StripeElements, Appearance, StripePaymentElementOptions } from '@stripe/stripe-js';
import { environment } from '../environments/environment';
import { ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CurrencyPipe } from '@angular/common';
import { LocalStorageService } from '../local-storage.service';

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
  paymentData: any = null;

  constructor(
    private activatedRoute: ActivatedRoute,
    private httpClient: HttpClient,
    private currencyPipe: CurrencyPipe,
    private localStorageService: LocalStorageService
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
        this.httpClient.get(`${environment.serverUrl}/posapi/payment-intent/${this.paymentIntent}`).subscribe(async (res: any) => {
          if (res) {
            this.paymentData = res.data;
            if (this.paymentData.status === 'succeeded') {
              await this.updateOrderAfterPayment(this.paymentData);
            }
          }
        })
      }
    } catch (error) {
      console.error(error)
    }
  }

  async updateOrderAfterPayment(orderDetail: any) {
    let tokenData = null;
    const authToken = this.localStorageService.getItem('orderData');
    if (authToken) {
      tokenData = JSON.parse(authToken);
    }
    try {
      let transactionPayment = [];
      transactionPayment.push({
        _id: this.generateRandomString(24),
        userInfo: '',
        userSessionId: this.generateRandomString(16),
        paymentInfo: {
          amount: (orderDetail.amount_received / 100),
          type: 'card'
        },
        paid: true,
      });
      const payload = {
        status: 'Processing',
        payment: transactionPayment
      }
      this.httpClient.put(`${environment.serverUrl}/posapi/location/${orderDetail.metadata.location}/order/${orderDetail.metadata.order}/update`, payload, { headers: new HttpHeaders({'Authorization': tokenData.userToken }) }).subscribe((res: any) => {
        console.log('res: ', res);
      })
    } catch (error) {
      console.error(error)
    }
  }

  generateRandomString = (length: any) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let result = '';
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

}
