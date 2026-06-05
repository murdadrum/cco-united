import { LightningElement, track } from 'lwc';
import { createRecord } from 'lightning/uiRecordApi';
import CASE_OBJECT from '@salesforce/schema/Case';
import SUBJECT_FIELD from '@salesforce/schema/Case.Subject';
import DESCRIPTION_FIELD from '@salesforce/schema/Case.Description';
import STATUS_FIELD from '@salesforce/schema/Case.Status';
import ORIGIN_FIELD from '@salesforce/schema/Case.Origin';
import SUPPLIED_NAME_FIELD from '@salesforce/schema/Case.SuppliedName';
import SUPPLIED_EMAIL_FIELD from '@salesforce/schema/Case.SuppliedEmail';
import SUPPLIED_PHONE_FIELD from '@salesforce/schema/Case.SuppliedPhone';

const EMPTY_FORM = { name: '', email: '', phone: '', program: '', message: '' };

export default class HousingInquiryForm extends LightningElement {
    @track form = { ...EMPTY_FORM };
    submitted = false;
    isSubmitting = false;
    errorMsg = '';

    handleInput(event) {
        const { name, value } = event.target;
        this.form = { ...this.form, [name]: value };
    }

    async handleSubmit(event) {
        event.preventDefault();
        if (!this.form.name || !this.form.email) {
            this.errorMsg = 'Please provide your name and email address.';
            return;
        }
        this.errorMsg = '';
        this.isSubmitting = true;

        const subject = this.form.program
            ? `Housing Inquiry — ${this.form.program}`
            : 'Housing Inquiry — General';

        const description = [
            `Name: ${this.form.name}`,
            `Email: ${this.form.email}`,
            this.form.phone ? `Phone: ${this.form.phone}` : null,
            this.form.program ? `Program: ${this.form.program}` : null,
            this.form.message ? `\nMessage:\n${this.form.message}` : null,
        ].filter(Boolean).join('\n');

        const fields = {
            [SUBJECT_FIELD.fieldApiName]:       subject,
            [DESCRIPTION_FIELD.fieldApiName]:   description,
            [STATUS_FIELD.fieldApiName]:         'New',
            [ORIGIN_FIELD.fieldApiName]:         'Web',
            [SUPPLIED_NAME_FIELD.fieldApiName]:  this.form.name,
            [SUPPLIED_EMAIL_FIELD.fieldApiName]: this.form.email,
            [SUPPLIED_PHONE_FIELD.fieldApiName]: this.form.phone || '',
        };

        try {
            await createRecord({ apiName: CASE_OBJECT.objectApiName, fields });
            this.submitted = true;
        } catch (err) {
            console.error('housingInquiryForm createRecord error:', err);
            this.errorMsg = 'Something went wrong. Please try again or contact us directly.';
        } finally {
            this.isSubmitting = false;
        }
    }

    handleReset() {
        this.form = { ...EMPTY_FORM };
        this.submitted = false;
        this.errorMsg = '';
    }
}
