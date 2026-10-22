# Production delivery audit — October 21, 2026

PR 30 remains unmerged. This follow-up extends that existing review branch;
no production routing, deployment configuration or build was changed/requested.

## Verified delivery evidence

- Cloudflare DNS: apex A records target 185.199.108–111.153; www CNAME targets
  techfusionreport.github.io. Both are proxied.
- Cloudflare Worker routes: only /ops/api/* is assigned on apex/www, to
  techfusion-api. There is no public-site route for website, and no apex/www
  Workers custom-domain assignment. No Cloudflare Pages project serves this site.
- Direct public Blog HTTP headers include x-github-request-id,
  x-github-edge-region, Via varnish and X-Served-By cache-iad, behind Cloudflare.
  Together these establish the public origin as GitHub Pages.
- The separate website Worker uses the Website Git repository. Its main build
  command is npx wrangler deploy; non-main branches use versions upload. Main
  merge baab84c built successfully and produced the 100% Worker deployment
  85a41cca-84d4-462e-a01b-929827c99614, version
  6b28ab26-3881-4bfe-8795-274657495fd5. This does not serve apex/www traffic.
- Workers build 36d18297-5cfd-4d21-9917-aa9ff4110de6 for bot commit 2b00ef1
  is explicitly marked skipped; its commit message contains [skip ci].
- The GitHub connector rejects the Pages-settings endpoint; unauthenticated REST
  returns 404. Exact Pages branch/directory settings were not available to inspect.
  They are checked at runtime before the proposed handoff, not assumed silently.

## Identified deployment gap

GitHub documents that commits made by workflows using GITHUB_TOKEN do not trigger
Pages builds. The rebuild workflow used that token, then expected a generated
commit to become public on its own. Therefore a source publication could reach
GitHub while regenerated listings waited for another build-triggering commit.
The separate Cloudflare build does not fix the public Pages deployment path.

## Proposed correction in PR 30

The rebuild job exports whether generated output changed and its pushed commit.
A separate job has Pages write permission and runs only for main, outside PRs,
after a successful changed-output push. It checks out that generated commit and
runs scripts/request_pages_build.py --request using the workflow token.

The helper verifies repository, event and main ref, then reads existing Pages
settings. It refuses any configuration except legacy branch publishing from
main/root, without changing those settings. Only then does it request a build
through the documented Pages REST endpoint. The default helper mode only reads.
The Pages job is skipped for feature branches, PRs and unchanged output. The
existing bot skip marker is retained; deployment is requested explicitly instead
of relying on a recursive push event. API failures fail the handoff visibly.

## Verification and remaining limits

Mocked API checks cover wrong repository/ref/event, absent token, workflow-based
Pages, incorrect source branch/directory, dry-run behavior and the exact GET→POST
request sequence. No production API write is used for testing. Syntax, generator
validation and workflow checks are run before review.

A queued Pages-build request is not proof of a successful deployment. After the
first real main publication, inspect Pages build completion and compare the public
Blog/category HTML and posts.json with the generated commit. If actual Pages
settings differ, the guarded job fails and those settings must be reviewed; this
PR does not reconfigure hosting or migrate deployment providers. Cloudflare cache
freshness must also be considered when checking public output.

## Primary references

- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- https://docs.github.com/en/actions/concepts/security/github_token
- https://docs.github.com/en/rest/pages/pages#request-a-github-pages-build
