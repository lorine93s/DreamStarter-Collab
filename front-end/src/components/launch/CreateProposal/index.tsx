"use client";

import { Formik, Form, Field, ErrorMessage } from "formik";
import Button from "@/components/common/Button";
import { Input, InputNumber, Radio, DatePicker } from "antd";
import { useProposal } from "@/ContextProviders/ProposalProvider";
import { enqueueSnackbar } from "notistack";
import Nav2 from "@/components/common/Nav/nav2";

const CreateProposal = () => {
  const { setProposal } = useProposal();

  interface FormMessage {
    description: string;
    title: string;
    priceperNFT: number;
    funding_goal: number;
    proposal_type: string;
    date: any;
  }
  const initialValues: FormMessage = {
    title: "",
    description: "",
    priceperNFT: 1,
    funding_goal: 20,
    proposal_type: "",
    date: ``,
  };
  return (
    <>
      <main className="flex">

        <div className="" style={{
          backgroundImage: `url('/form.png')`, backgroundSize: 'cover',
          height: '730px',
          width: '780px',
        }}>
          <div className="flex gap-2 items-center p-6 px-16">
            <div className="text-2xl">
              <img
                src="/nav.png"
                alt=""
                width="30px"
                height="10px"
              />
            </div>
            <div className="text-black text-xl font-semibold">
              <a href="/">Dreamstarter</a>
            </div>
          </div>
        </div>

        <div className="text-sm w-[750px] bg-blue-200 ">
          <div className="fixed top-0 right-0">
            <Nav2 />
          </div>
          <div className="p-16">
            <Formik
              initialValues={initialValues}
              onSubmit={(values, actions) => {
                setProposal(values);
                enqueueSnackbar(`${values.title} has been created`, {
                  variant: "success",
                });
                actions.setSubmitting(false);
              }}x
            >
              {({ isSubmitting, setFieldValue, values }) => (
                <Form>
                  <div className="text-black text-2xl mb-1  font-semibold mt-20">
                    Submit Proposal
                  </div>
                  <div className="text-black  mb-6 bold italic">
                    Submit your project proposals and ideas for community votes
                    and crowdfunding
                  </div>
                  <div className="text-black flex flex-col gap-6">
                    {/* ------------------------  */}
                    <div>
                      <label className="font-medium" htmlFor="title">
                        Proposal Title
                      </label>
                      <div className="mt-2 w-[300px]">
                        <Input
                      style={{background: "#4AA5F4" }}
                      className="rounded-full text-white"
                          required
                          value={values.title}
                          onChange={(e: { target: { value: string } }) => {
                            setFieldValue("title", e.target.value);
                          }}
                        />
                      </div>
                    </div>
                    {/* -------------  */}

                    {/* ------------------------  */}
                    <div>
                      <label className="font-medium" htmlFor="description">
                        Description
                      </label>
                      <div className=" mt-2 w-[300px]">
                        <Input.TextArea
                        style={{background: "#4AA5F4" }}
                        className="rounded-full text-white"
                          required
                          value={values.description}
                          onChange={(e: { target: { value: string } }) => {
                            setFieldValue("description", e.target.value);
                          }}
                        />
                      </div>
                    </div>

                    {/* -------------  */}
                    <div className="flex items-center gap-8">
                      {/* ------------------------  */}
                      <div>
                        <label className="font-medium" htmlFor="priceperNFT">
                          Price per NFT
                        </label>
                        <div className="mt-2">
                          <InputNumber
                          style={{background: "#4AA5F4" }}
                          className="rounded-full text-white"
                            required
                            value={values.priceperNFT}
                            onChange={(e) => {
                              setFieldValue("priceperNFT", e);
                            }}
                          />
                        </div>
                      </div>

                      {/* -------------  */}

                      {/* ------------------------  */}
                      <div>
                        <label className="text-black font-medium" htmlFor="funding_goal">
                          Funding Goal
                        </label>
                        <div className="mt-2">
                          <InputNumber
                          style={{background: "#4AA5F4" }}
                          className="rounded-full text-white"
                            required
                            value={values.funding_goal}
                            onChange={(e) => {
                              setFieldValue("funding_goal", e);
                            }}
                          />
                        </div>
                      </div>

                      {/* -------------  */}
                    </div>
                    {/* ------------ */}
                    <Radio.Group
                    
                      onChange={(e) => {
                        setFieldValue("proposal_type", e.target.value);
                      }}
                      value={values.proposal_type}
                    >
                      <Radio value={"collab"} className="!font-raleway text-black">
                        {" "}
                        Dreamstarter Collab
                      </Radio>
                      <Radio value={"holder"} className="!font-raleway text-black">
                        {" "}
                        Dreamstarter Holder
                      </Radio>
                    </Radio.Group>

                    {/* ----------  */}

                    {/* ----------------------  */}
                    <div>
                      <div>
                        <label htmlFor="date" className="block mb-2">
                          Valid till
                        </label>

                        <DatePicker
                        style={{background: "#4AA5F4" }}
                        className="rounded-full text-white"
                          onChange={(e) => {
                            setFieldValue("date", e);
                          }}
                        />
                      </div>
                    </div>

                    {/* ---------------------- */}
                  </div>

                  <div className="mt-5">
                    <Button
                      style={{ color: "white", borderRadius: '9999px', background: "#0F4C81" }}
                      className="hover:bg-sky-500"
                      type="submit"
                      _isSubmitting={isSubmitting}
                      disabled={isSubmitting} variant={""}  >
                      Create Proposal
                    </Button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </main>
    </>
  );
};

export default CreateProposal;
