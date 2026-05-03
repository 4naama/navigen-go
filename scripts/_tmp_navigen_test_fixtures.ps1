$NavigenStripePrices = @{
  standard = [pscustomobject]@{
    priceId = "price_1TDfBIFf2RZOYEdOobudnFRW"
    grossAmount = 1
    currency = "EUR"
  }
  multi = [pscustomobject]@{
    priceId = "price_1TDfBtFf2RZOYEdOGIfPn6uu"
    grossAmount = 2
    currency = "EUR"
  }
  large = [pscustomobject]@{
    priceId = "price_1TDfDfFf2RZOYEdOFicVRcQ8"
    grossAmount = 349
    currency = "EUR"
  }
  network = [pscustomobject]@{
    priceId = "price_1TDfFaFf2RZOYEdOXzIMBxbO"
    grossAmount = 749
    currency = "EUR"
  }
}

$NavigenTestLocations = @(
  [pscustomobject]@{
    key = "budakeszi"
    name = "HD Budakeszi"
    slug = "hd-budakeszi-7088"
    slugAliases = @()
    ulid = "06A1YABW026FH2QXP498W1JMW0"
    restorePaymentIntentIds = @(
      "pi_3TAmdmFf2RZOYEdO0Q5HfjxB"
    )
    legacyPaymentIntentIds = @(
      "pi_3T03QDFf2RZOYEdO1gdV2v8o",
      "pi_3T03WiFf2RZOYEdO1gwe5gDR"
    )
    checkoutSessionIds = @(
      "cs_live_a1X2iLh6PJHh40LVMt0MTrKGRuvUiKdZQ9N2SKi0SWYy5VTb9fggoyIDXG",
      "cs_live_a1cwJPo7fujjwP7M3CRwA0sktgnS78QyOOHMJ7YbyUze1xQNJUEu4FHFeN"
    )
    expiredPaymentIntentIds = @()
    expiredCheckoutSessionIds = @()
    campaignKeys = @(
      "ps-all-260323-074134"
    )
    purpose = @(
      "restore",
      "active-plan",
      "active-campaign-with-promo-qr",
      "all-campaign-scope"
    )
  }

  [pscustomobject]@{
    key = "budapest1-dezso"
    name = "Budapest1 Dezső"
    slug = "hd-budapest1-dezso-3648"
    slugAliases = @()
    ulid = "06A1YABW00MPDDMV2JZ190R7S8"
    restorePaymentIntentIds = @(
      "pi_3SooErFf2RZOYEdO1KiJWvCf"
    )
    legacyPaymentIntentIds = @()
    checkoutSessionIds = @(
      "cs_live_a1iopTbsRJLf8cMiICIIRhoQCOgZRy0y967pE1Csw1kMNXFQQZBBUyKQwq"
    )
    expiredPaymentIntentIds = @(
      "pi_3SyvBiFf2RZOYEdO1bbYfR99"
    )
    expiredCheckoutSessionIds = @(
      "cs_live_a1wFvqlhbqTHHrhpG1SryhflpVOibLZT5Zazrx0Qc8eHxVmrUIygfNxutF"
    )
    campaignKeys = @()
    purpose = @(
      "restore",
      "expired-payment-negative-test"
    )
  }

  [pscustomobject]@{
    key = "budapest4-kaposztasmegyer"
    name = "Budapest4 Káposztásmegyer"
    slug = "hd-budapest4-kaposztasmegyer-4587"
    slugAliases = @()
    ulid = "06A1YABW03802QBYN2RE9J6BM4"
    restorePaymentIntentIds = @(
      "pi_3T0PeEFf2RZOYEdO1vWaRLsT"
    )
    legacyPaymentIntentIds = @()
    checkoutSessionIds = @()
    expiredPaymentIntentIds = @()
    expiredCheckoutSessionIds = @()
    campaignKeys = @()
    purpose = @(
      "restore",
      "session-mismatch-negative-test"
    )
  }

  [pscustomobject]@{
    key = "debrecen-darabos"
    name = "Debrecen Darabos"
    slug = "hd-debrecen-darabos-4026"
    slugAliases = @(
      "hd-debrecen-darabos-4026-26-01"
    )
    ulid = "06A1YABW027YKN4QXD2PEMY2X8"
    restorePaymentIntentIds = @(
      "pi_3TAwKlFf2RZOYEdO0pzf32p3"
    )
    legacyPaymentIntentIds = @()
    checkoutSessionIds = @()
    expiredPaymentIntentIds = @()
    expiredCheckoutSessionIds = @()
    campaignKeys = @()
    purpose = @(
      "restore",
      "active-plan"
    )
  }

  [pscustomobject]@{
    key = "debrecen-hadhazi"
    name = "Debrecen Hadházi"
    slug = "hd-debrecen-hadhazi-8910"
    slugAliases = @()
    ulid = "06A1YABW02N0MFW16PDJ38XJYR"
    restorePaymentIntentIds = @()
    legacyPaymentIntentIds = @(
      "pi_3T05ObFf2RZOYEdO1gIXONK2"
    )
    checkoutSessionIds = @(
      "cs_live_a1oun5CsDOQenVoeel50jh9m7Jkgnu7e57LDfPSwQgf0W7Dxy9TQHtoMrz"
    )
    expiredPaymentIntentIds = @()
    expiredCheckoutSessionIds = @()
    campaignKeys = @()
    purpose = @(
      "legacy-plan",
      "multi-location-candidate"
    )
  }

  [pscustomobject]@{
    key = "nagykovacsi"
    name = "Nagykovácsi"
    slug = "hd-nagykovacsi-9457"
    slugAliases = @(
      "hd-nagykovacsi-9457-26-01"
    )
    ulid = "06A1YABW02BPQGG97N2MVWYRE8"
    restorePaymentIntentIds = @()
    legacyPaymentIntentIds = @(
      "pi_3T2pYPFf2RZOYEdO0eLdZFPV",
      "pi_3T2ur4Ff2RZOYEdO1sVBmFYH"
    )
    checkoutSessionIds = @()
    expiredPaymentIntentIds = @()
    expiredCheckoutSessionIds = @()
    campaignKeys = @()
    purpose = @(
      "legacy-plan",
      "multi-location-candidate"
    )
  }

  [pscustomobject]@{
    key = "costes-catering"
    name = "Costes Catering"
    slug = "costes-catering-0409"
    slugAliases = @()
    ulid = "06A1YABW00K5DJ576BZDC45104"
    restorePaymentIntentIds = @()
    legacyPaymentIntentIds = @()
    checkoutSessionIds = @()
    expiredPaymentIntentIds = @()
    expiredCheckoutSessionIds = @()
    campaignKeys = @()
    purpose = @(
      "seed-candidate",
      "multi-location-candidate"
    )
  }

  [pscustomobject]@{
    key = "world-of-souvenir-deak"
    name = "World of Souvenir Deák"
    slug = "world-of-souvenir-deak-1655"
    slugAliases = @()
    ulid = "06A1YABW03MMAG8E1TJETYWNJ4"
    restorePaymentIntentIds = @()
    legacyPaymentIntentIds = @()
    checkoutSessionIds = @()
    expiredPaymentIntentIds = @()
    expiredCheckoutSessionIds = @()
    campaignKeys = @()
    purpose = @(
      "seed-candidate",
      "multi-location-candidate"
    )
  }
)