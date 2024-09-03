import { Component, OnInit } from '@angular/core';
import { loadStripe, Stripe, StripeElements, Appearance, StripePaymentElementOptions } from '@stripe/stripe-js';
import { environment } from '../environments/environment';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss']
})

export class PaymentComponent implements OnInit {
  stripe: Stripe | null = null;
  elements: StripeElements | null = null;
  clientSecret: any = null;
  tokenData: any = null
  orderData: any = null

  constructor(
    private httpClient: HttpClient,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) { }

  async ngOnInit() {
    // Initialize Stripe
    this.stripe = await loadStripe(environment.STRIPE_PUBLISHABLE_KEY);

    this.activatedRoute.queryParams.subscribe((queryParams) => {
      console.log('queryParams: ', queryParams);
      let token = queryParams['token']
      if(token) {
        const arrayToken = token.split('.');
        this.tokenData = JSON.parse(atob(arrayToken[1]));
      }
      console.log('tokenData: ', this.tokenData)
    })

    await this.getOrderInfo()
  }

  async getOrderInfo() {
    try {
      if (this.tokenData && this.tokenData.venueId && this.tokenData.orderId) {
        this.httpClient.get(`${environment.serverUrl}/posapi/venues/${this.tokenData.venueId}/order/${this.tokenData.orderId}`).subscribe(async (res: any) => {
          if (res && res.data) {
            console.log('order res: ', res);
            this.orderData = res.data
            // Fetch payment intent and initialize payment form
            await this.initializePayment();
          } else {
            console.error('payment data not found.')
          }
        })
      } else {
        console.error('Token data not found from params.')
      }
    } catch (error) {
      console.error(error)
    }
  }

  async initializePayment() {
    console.log('this.tokenData: ->>>>>>', this.tokenData);
    console.log('this.orderData: ->>>>>>', this.orderData);
    try {
      if (this.orderData) {
        let payload = {
          amount: this.orderData.amount || 1000
        }

        this.httpClient.post(`${environment.serverUrl}/posapi/create-payment-intent`, payload).subscribe((res: any) => {
          if (res && res.data) {
            console.log('PAYMENT res: ', res);
            // let dpmCheckerLink = res.data.dpmCheckerLink
            this.clientSecret = res.data.clientSecret;
            let clientSecret = this.clientSecret

            const appearance: Appearance = {
              theme: 'stripe',
            };
            this.elements = this.stripe!.elements({ appearance, clientSecret });

            const paymentElementOptions: StripePaymentElementOptions = {
              layout: "tabs",
            };

            const paymentElement = this.elements.create("payment", paymentElementOptions);
            paymentElement.mount("#payment-element");
            // this.setDpmCheckerLink(dpmCheckerLink);
          }
        })
      } else {
        console.error('Order data not found to process payment...')
      }
    } catch (error) {
      console.error(error)
    }
  }

  async handleSubmit(event: Event) {
    event.preventDefault();

    if (!this.stripe || !this.elements) {
      return;
    }

    this.setLoading(true);

    this.stripe.confirmCardPayment(this.clientSecret)
      .then((result) => {
        console.log('confirm payment: ->>>>>>', result)
        // Handle result.error or result.paymentIntent
        console.log('error: ', result.error);
        if (result.error?.type === "card_error" || result.error?.type === "validation_error") {
          this.showMessage(result.error.message);
        } else {
          this.showMessage("An unexpected error occurred.");
        }
      });

    // const { error } = await this.stripe.confirmPayment({
    //   elements: this.elements,
    //   confirmParams: {
    //     // Make sure to change this to your payment completion page
    //     return_url: "http://localhost:4300/success",
    //   },
    // });

    // console.log('error: ', error);
    // if (error?.type === "card_error" || error?.type === "validation_error") {
    //   this.showMessage(error.message);
    // } else {
    //   this.showMessage("An unexpected error occurred.");
    // }

    this.setLoading(false);
  }

  showMessage(messageText: any) {
    const messageContainer = document.querySelector("#payment-message") as HTMLElement;

    messageContainer.classList.remove("hidden");
    messageContainer.textContent = messageText;

    setTimeout(() => {
      messageContainer.classList.add("hidden");
      messageContainer.textContent = "";
    }, 4000);
  }

  setLoading(isLoading: boolean) {
    console.log('isLoading: ', isLoading);
    const submitButton = document.querySelector("#submit") as HTMLButtonElement;
    const spinner = document.querySelector("#spinner") as HTMLElement;
    const buttonText = document.querySelector("#button-text") as HTMLElement;

    if (isLoading) {
      submitButton.disabled = true;
      spinner.classList.remove("hidden");
      buttonText.classList.add("hidden");
    } else {
      submitButton.disabled = false;
      spinner.classList.add("hidden");
      buttonText.classList.remove("hidden");
    }
  }

  // setDpmCheckerLink(url: string) {
  //   const dpmIntegrationChecker = document.querySelector("#dpm-integration-checker") as HTMLAnchorElement;
  //   dpmIntegrationChecker.href = url;
  // }
}
