import { Component, OnInit } from '@angular/core';
import { loadStripe, Stripe, StripeElements, Appearance, StripePaymentElementOptions } from '@stripe/stripe-js';
import { environment } from '../environments/environment';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { LocalStorageService } from '../local-storage.service';

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
  customerData: any = null

  constructor(
    private httpClient: HttpClient,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private localStorageService: LocalStorageService
  ) { }

  async ngOnInit() {
    // Initialize Stripe
    this.stripe = await loadStripe(environment.STRIPE_PUBLISHABLE_KEY);

    this.activatedRoute.queryParams.subscribe((queryParams) => {
      console.log('queryParams: ', queryParams);
      let token = queryParams['token']
      if (token) {
        const arrayToken = token.split('.');
        this.tokenData = JSON.parse(atob(arrayToken[1]));
        this.localStorageService.setItem('orderData', JSON.stringify(this.tokenData));
      }
    })

    // await this.getOrderInfo()

    if (this.tokenData && this.tokenData.paymentTokenId) {
      this.customerData = this.tokenData.customer
      await this.initializePayment();
    }
  }

  // async getOrderInfo() {
  //   try {
  //     if (this.tokenData && this.tokenData.locationId && this.tokenData.orderId) {
  //       this.httpClient.get(`${environment.serverUrl}/posapi/location/${this.tokenData.locationId}/order/${this.tokenData.orderId}`).subscribe(async (res: any) => {
  //         if (res && res.data) {
  //           this.orderData = res.data
  //           await this.initializePayment();
  //         } else {
  //           console.error('payment data not found.')
  //         }
  //       })
  //     } else {
  //       console.error('Token data not found from params.')
  //     }
  //   } catch (error) {
  //     console.error(error)
  //   }
  // }

  async initializePayment() {
    try {
      // if (this.orderData) {
      let payload = {
        amount: this.tokenData.amount,
        orderId: this.tokenData.orderId,
        locationId: this.tokenData.locationId,
        customer: this.customerData,
        orderNumber: this.tokenData.orderNumber
      }

      this.httpClient.post(`${environment.serverUrl}/posapi/create-payment-intent`, payload).subscribe((res: any) => {
        if (res && res.data) {
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
        }
      })
      // } else {
      //   console.error('Order data not found to process payment...')
      // }
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

    const payment = await this.stripe.confirmPayment({
      elements: this.elements,
      confirmParams: {
        return_url: `${environment.liveURL}success`,
      },
    });

    if (payment.error?.type === "card_error" || payment.error?.type === "validation_error") {
      this.showMessage(payment.error.message);
    } else {
      this.showMessage("An unexpected error occurred.");
    }

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

}
