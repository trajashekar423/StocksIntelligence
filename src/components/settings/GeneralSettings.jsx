import { useEffect, useMemo, useState } from 'react';
import { getUser } from '../../utils/authStorage';

const EMPTY_VALUE = '—';

function firstValue(...values) {
  return values.find(value => value !== undefined && value !== null && String(value).trim() !== '') ?? '';
}

function getFirstRecord(value) {
  return Array.isArray(value) ? value.find(Boolean) ?? {} : value ?? {};
}

function getInitials(name) {
  const parts = String(name || 'Account').trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map(part => part.charAt(0).toUpperCase()).join('') || 'A';
}

function buildAccountDetails(userData = {}) {
  const user = userData ?? {};
  const merchant = getFirstRecord(user.merchant);
  const client = getFirstRecord(user.client);
  const business = getFirstRecord(user.business);
  const selectedBusiness = getFirstRecord(user.selected_business ?? user.selectedBusiness);
  const firstBusiness = getFirstRecord(user.businesses);
  const firstStore = getFirstRecord(user.stores);
  const firstLocation = getFirstRecord(user.locations);
  const profile = getFirstRecord(user.profile);

  const name = firstValue(
    user.name,
    user.display_name,
    user.full_name,
    profile.name,
    [user.first_name, user.last_name].filter(Boolean).join(' ')
  );

  const email = firstValue(user.email, user.email_address, profile.email, profile.email_address);
  const phone = firstValue(
    user.phone,
    user.phone_number,
    user.mobile_number,
    user.mobile,
    profile.phone,
    profile.phone_number,
    profile.mobile_number
  );

  const merchantName = firstValue(
    merchant.business_name,
    merchant.merchant_name,
    merchant.name,
    client.business_name,
    client.merchant_name,
    client.name,
    business.business_name,
    business.merchant_name,
    business.name,
    selectedBusiness.business_name,
    selectedBusiness.name,
    firstBusiness.business_name,
    firstBusiness.name,
    firstStore.business_name,
    firstStore.name,
    firstLocation.business_name,
    firstLocation.name,
    user.business_name,
    user.merchant_name
  );

  const brandLogo = firstValue(
    merchant.brand_logo,
    merchant.logo,
    merchant.logo_url,
    client.brand_logo,
    client.logo,
    client.logo_url,
    business.brand_logo,
    business.logo,
    selectedBusiness.brand_logo,
    firstBusiness.brand_logo,
    firstStore.brand_logo,
    firstLocation.brand_logo,
    user.brand_logo
  );

  return { name, email, phone, merchantName, brandLogo };
}

function SkeletonAccount() {
  return (
    <div className="st-sections st-sections--flat">
      <div className="st-card st-account-card">
        <div className="st-card-header">Account info</div>
        <div className="st-card-body">
          <div className="st-account-card-head">
            <div className="st-avatar st-avatar--skeleton" />
            <div className="st-account-summary">
              <div className="ps-skeleton ps-skeleton--short" />
              <div className="ps-skeleton ps-skeleton--short st-skeleton-line" />
            </div>
          </div>
          {[0, 1, 2, 3].map(item => (
            <div className="st-field" key={item}>
              <div className="ps-skeleton ps-skeleton--label" />
              <div className="ps-skeleton" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function GeneralSettings() {
  const [user, setUser] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    setUser(getUser());
    setLoaded(true);
  }, []);

  const account = useMemo(() => buildAccountDetails(user), [user]);
  const displayName = account.name || EMPTY_VALUE;
  const displayMerchantName = account.merchantName || EMPTY_VALUE;
  const displayEmail = account.email || EMPTY_VALUE;
  const displayPhone = account.phone || 'No phone available';
  const showLogo = Boolean(account.brandLogo) && !logoFailed;

  if (!loaded) return <SkeletonAccount />;

  return (
    <div className="st-sections st-sections--flat">
      <div className="st-card st-account-card">
        <div className="st-card-header">Account info</div>
        <div className="st-card-body">
          <div className="st-account-card-head">
            <div className="st-avatar">
              {showLogo ? (
                <img
                  src={account.brandLogo}
                  alt="Brand logo"
                  onError={() => setLogoFailed(true)}
                  className="st-avatar-img"
                />
              ) : (
                <span>{getInitials(account.name || account.merchantName)}</span>
              )}
            </div>
            <div>
              <div className="st-account-name">{displayName}</div>
              <div className="st-account-role">{displayMerchantName}</div>
            </div>
          </div>

          <div className="st-field">
            <label className="st-label">Full name</label>
            <input className="st-input" type="text" readOnly value={account.name || EMPTY_VALUE} />
          </div>
          <div className="st-field">
            <label className="st-label">Email</label>
            <input className="st-input" type="email" readOnly value={displayEmail} />
          </div>
          <div className="st-field">
            <label className="st-label">Phone number</label>
            <input className="st-input" type="tel" readOnly value={displayPhone} />
          </div>
          <div className="st-field">
            <label className="st-label">Merchant name</label>
            <input className="st-input" type="text" readOnly value={displayMerchantName} />
          </div>
          <div className="st-field">
            <label className="st-label">Brand logo</label>
            <div className="st-brand-logo-preview">
              {showLogo ? (
                <img
                  src={account.brandLogo}
                  alt="Brand logo"
                  onError={() => setLogoFailed(true)}
                  className="st-brand-logo-img"
                />
              ) : (
                <span>{getInitials(account.name || account.merchantName)}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
